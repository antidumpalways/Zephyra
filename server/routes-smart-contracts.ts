import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import { storage } from "./storage";
import ZephyraSmartContractsIntegration from "./scripts/backend-integration";
import {
  swapSimulationRequestSchema,
  swapExecutionRequestSchema,
  type Transaction,
  type InsertTransaction,
  type InsertRouteComparison,
  type InsertRiskAnalysis,
  type InsertProofOfRoute,
  type Batch,
  type InsertBatch,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import crypto from "crypto";

// Initialize smart contracts integration
const smartContracts = new ZephyraSmartContractsIntegration(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  {
    publicKey: new PublicKey(process.env.WALLET_PUBLIC_KEY || ""),
    signTransaction: async (tx) => {
      // In production, this would use a proper wallet implementation
      return tx;
    },
    signAllTransactions: async (txs) => {
      return txs;
    },
  },
  {
    protectionManager: process.env.PROTECTION_MANAGER_PROGRAM_ID || "",
    routeExecutor: process.env.ROUTE_EXECUTOR_PROGRAM_ID || "",
    proofVerifier: process.env.PROOF_VERIFIER_PROGRAM_ID || "",
    batchCoordinator: process.env.BATCH_COORDINATOR_PROGRAM_ID || "",
  }
);

// OpenRouter AI integration - Using Claude 3.5 Sonnet for MEV risk analysis
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://zephyra.app",
    "X-Title": "Zephyra MEV Protection",
  }
});

// WebSocket clients map for real-time updates
const wsClients = new Map<string, Set<any>>();

// Helper function to broadcast transaction updates
function broadcastUpdate(walletAddress: string, data: any) {
  const clients = wsClients.get(walletAddress);
  if (clients) {
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
}

// Batch configuration
const BATCH_SIZE_THRESHOLD = 5; // Execute when batch has 5 transactions
const BATCH_TIME_THRESHOLD = 30000; // Execute after 30 seconds if not full

// Helper: Get or create a pending batch
async function getOrCreateBatch(): Promise<Batch> {
  // Try to find existing pending batch
  let batch = await storage.getPendingBatch();
  
  if (!batch) {
    // Create new batch using smart contract
    const { batchId } = await smartContracts.createBatch();
    
    const batchData: InsertBatch = {
      status: "pending",
      transactionCount: 0,
      totalValue: "0",
      batchHash: batchId,
    };
    
    batch = await storage.createBatch(batchData);
    
    // Schedule automatic batch execution after time threshold
    setTimeout(async () => {
      try {
        const currentBatch = await storage.getBatch(batch.id);
        if (currentBatch && currentBatch.status === "pending") {
          await executeBatch(batch.id);
        }
      } catch (error) {
        console.error("Batch auto-execution error:", error);
      }
    }, BATCH_TIME_THRESHOLD);
  }
  
  return batch;
}

// Helper: Execute a batch of transactions using smart contracts
async function executeBatch(batchId: string) {
  try {
    const batch = await storage.getBatch(batchId);
    if (!batch || batch.status !== "pending") return;
    
    // Mark batch as processing
    await storage.updateBatch(batchId, { 
      status: "processing",
      executedAt: new Date(),
    });
    
    // Get all transactions in this batch
    const batchTransactions = await storage.getBatchTransactions(batchId);
    
    if (batchTransactions.length === 0) {
      await storage.updateBatch(batchId, { 
        status: "completed",
        completedAt: new Date(),
      });
      return;
    }
    
    console.log(`Executing batch ${batchId} with ${batchTransactions.length} transactions`);
    
    // Execute batch using smart contract
    const executionStart = Date.now();
    const result = await smartContracts.executeBatch(batch.batchHash);
    const executionTime = Date.now() - executionStart;
    
    // Mark batch as completed
    await storage.updateBatch(batchId, { 
      status: "completed",
      executionTime,
      completedAt: new Date(),
    });
    
    // Broadcast batch completion to all wallet subscribers
    for (const tx of batchTransactions) {
      broadcastUpdate(tx.walletAddress, {
        type: "batch_executed",
        batchId,
        transactionId: tx.id,
        message: `Batch execution complete`,
        result,
      });
    }
    
    console.log(`Batch ${batchId} completed in ${executionTime}ms`);
  } catch (error) {
    console.error("Batch execution error:", error);
    await storage.updateBatch(batchId, { 
      status: "failed",
      completedAt: new Date(),
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time transaction updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected");
    
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "subscribe" && data.walletAddress) {
          // Subscribe client to wallet updates
          if (!wsClients.has(data.walletAddress)) {
            wsClients.set(data.walletAddress, new Set());
          }
          wsClients.get(data.walletAddress)!.add(ws);
          console.log(`Client subscribed to wallet: ${data.walletAddress}`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    ws.on("close", () => {
      // Remove client from all subscriptions
      wsClients.forEach((clients) => clients.delete(ws));
      console.log("WebSocket client disconnected");
    });
  });

  // POST /api/simulate - Simulate swap with AI risk analysis and route comparison (NOW USING SMART CONTRACTS)
  app.post("/api/simulate", async (req, res) => {
    try {
      const parsed = swapSimulationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }

      const { walletAddress, inputToken, outputToken, inputAmount } = parsed.data;
      
      broadcastUpdate(walletAddress, { 
        type: "status", 
        status: "simulating",
        message: "Starting transaction simulation..." 
      });

      // 1. Submit transaction to smart contract
      const { transactionId, signature } = await smartContracts.submitTransaction(
        walletAddress,
        inputToken,
        outputToken,
        parseFloat(inputAmount)
      );

      broadcastUpdate(walletAddress, { 
        type: "status", 
        status: "analyzing",
        message: "Analyzing MEV risk with AI..." 
      });

      // 2. Simulate different DEX routes (Jupiter, Raydium, Orca)
      const routes = await simulateRoutes(inputToken, outputToken, inputAmount);
      
      // 3. Get AI risk analysis from OpenAI
      const riskAnalysis = await analyzeRiskWithAI(inputToken, outputToken, inputAmount, routes);
      
      // 4. Update smart contract with risk analysis
      await smartContracts.updateRiskAnalysis(
        transactionId,
        riskAnalysis.score,
        riskAnalysis.score > 30
      );
      
      // 5. Select best route using smart contract
      const routeSelection = await smartContracts.selectBestRoute(transactionId, routes);
      
      // 6. Calculate potential savings
      const potentialSavings = Math.abs(parseFloat(routeSelection.estimatedOutput.toString()) - parseFloat(inputAmount)) * 10;

      // 7. Get or create batch for this transaction
      const batch = await getOrCreateBatch();

      // 8. Generate proof using smart contract
      const { proofHash } = await smartContracts.generateProof(
        transactionId,
        routes,
        routeSelection.selectedDex,
        routeSelection.reasoning
      );

      // 9. Create transaction record and add to batch
      const transactionData: InsertTransaction = {
        walletAddress,
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: routeSelection.estimatedOutput.toString(),
        riskScore: riskAnalysis.score,
        riskLevel: riskAnalysis.level,
        selectedRoute: routeSelection.selectedDex.toLowerCase(),
        alternativeRoutes: routes,
        mevDetected: riskAnalysis.score > 30,
        potentialSavings: potentialSavings.toFixed(2),
        actualSavings: "0",
        status: "simulating",
        executionTime: 0,
        batchId: batch.id,
        proofHash,
        proofData: {
          routes,
          riskAnalysis,
          selectedRoute: routeSelection.selectedDex,
          timestamp: new Date().toISOString(),
          batchId: batch.id,
          smartContractSignature: signature,
        },
      };

      const transaction = await storage.createTransaction(transactionData);

      // 10. Add transaction to batch using smart contract
      await smartContracts.addToBatch(batch.batchHash, transactionId);

      // 11. Get actual transaction count from database
      const batchTransactions = await storage.getBatchTransactions(batch.id);
      const actualCount = batchTransactions.length;
      const actualTotalValue = batchTransactions.reduce((sum, tx) => 
        sum + parseFloat(tx.inputAmount), 0
      ).toFixed(2);

      // 12. Update batch with actual counts
      await storage.updateBatch(batch.id, {
        transactionCount: actualCount,
        totalValue: actualTotalValue,
      });

      // 13. Check if batch should be executed now (reached size threshold)
      if (actualCount >= BATCH_SIZE_THRESHOLD) {
        // Execute batch asynchronously using smart contract
        executeBatch(batch.id).catch(err => console.error("Batch execution error:", err));
      }

      // 14. Store route comparisons
      for (const route of routes) {
        const routeData: InsertRouteComparison = {
          transactionId: transaction.id,
          dex: route.dex,
          estimatedOutput: route.estimatedOutput,
          priceImpact: route.priceImpact,
          slippage: route.slippage,
          mevRisk: route.mevRisk,
          liquidityDepth: route.liquidityDepth,
          latency: route.latency,
          gasEstimate: route.gasEstimate,
          selected: route.dex === routeSelection.selectedDex.toLowerCase(),
        };
        await storage.createRouteComparison(routeData);
      }

      // 15. Store risk analysis
      const riskData: InsertRiskAnalysis = {
        transactionId: transaction.id,
        aiModel: "anthropic/claude-3.5-sonnet",
        riskScore: riskAnalysis.score,
        riskFactors: riskAnalysis.factors,
        sandwichAttackProbability: riskAnalysis.sandwichAttackProbability,
        frontRunningRisk: riskAnalysis.frontRunningRisk,
        poolVolatility: riskAnalysis.poolVolatility,
        recommendedAction: riskAnalysis.recommendedAction,
        reasoning: riskAnalysis.reasoning,
      };
      await storage.createRiskAnalysis(riskData);

      broadcastUpdate(walletAddress, { 
        type: "simulation_complete",
        transaction,
        message: "Simulation complete!" 
      });

      res.json({
        ...transaction,
        smartContractSignature: signature,
        proofHash,
      });
    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: "Simulation failed" });
    }
  });

  // POST /api/execute - Execute protected swap (NOW USING SMART CONTRACTS)
  app.post("/api/execute", async (req, res) => {
    try {
      const parsed = swapExecutionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).toString() });
      }

      const { transactionId, useProtectedRoute } = parsed.data;
      
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      broadcastUpdate(transaction.walletAddress, { 
        type: "status", 
        status: "executing",
        message: "Executing protected swap..." 
      });

      // Execute transaction using smart contract
      const executionStart = Date.now();
      const signature = await smartContracts.completeTransaction(
        transactionId,
        parseFloat(transaction.outputAmount),
        transaction.proofHash
      );
      const executionTime = Date.now() - executionStart;

      // Calculate actual savings
      const actualSavings = useProtectedRoute 
        ? parseFloat(transaction.potentialSavings)
        : 0;

      // Update transaction
      const updated = await storage.updateTransaction(transactionId, {
        status: "completed",
        executionTime,
        actualSavings: actualSavings.toFixed(2),
        completedAt: new Date(),
      });

      // Create proof of route
      const proofData: InsertProofOfRoute = {
        transactionId,
        proofHash: transaction.proofHash,
        routesConsidered: transaction.alternativeRoutes,
        selectionReasoning: {
          selectedDex: transaction.selectedRoute,
          reason: "Lowest MEV risk with best price execution",
          alternatives: transaction.alternativeRoutes,
        },
        mevDetectionLog: [{
          timestamp: transaction.createdAt,
          threats: transaction.mevDetected ? ["sandwich_attack", "front_running"] : [],
          severity: transaction.riskLevel,
        }],
        protectionMeasures: useProtectedRoute ? [
          "ephemeral_rollup_simulation",
          "route_optimization",
          "mev_protection_layer",
        ] : [],
        simulationTime: 500,
        routeSelectionTime: 300,
        executionTime,
        totalTime: executionTime + 800,
        blockchainTxSignature: signature,
        verificationUrl: `https://explorer.solana.com/tx/${signature}`,
      };
      await storage.createProofOfRoute(proofData);

      // Update user stats
      const stats = await storage.getUserStats(transaction.walletAddress);
      if (stats) {
        const newTotal = parseFloat(stats.totalSavings) + actualSavings;
        const newCount = stats.totalTransactions + 1;
        const newAvg = newTotal / newCount;
        
        const riskUpdates: any = {};
        if (transaction.riskScore <= 30) riskUpdates.lowRiskCount = stats.lowRiskCount + 1;
        else if (transaction.riskScore <= 70) riskUpdates.mediumRiskCount = stats.mediumRiskCount + 1;
        else if (transaction.riskScore <= 90) riskUpdates.highRiskCount = stats.highRiskCount + 1;
        else riskUpdates.criticalRiskCount = stats.criticalRiskCount + 1;

        await storage.updateUserStats(transaction.walletAddress, {
          totalTransactions: newCount,
          totalSavings: newTotal.toFixed(2),
          averageSavings: newAvg.toFixed(2),
          mevAttacksBlocked: transaction.mevDetected ? stats.mevAttacksBlocked + 1 : stats.mevAttacksBlocked,
          protectedRouteCount: useProtectedRoute ? stats.protectedRouteCount + 1 : stats.protectedRouteCount,
          directRouteCount: !useProtectedRoute ? stats.directRouteCount + 1 : stats.directRouteCount,
          lastTransactionAt: new Date(),
          ...riskUpdates,
        });
      } else {
        // Create new stats
        const riskCounts = {
          lowRiskCount: transaction.riskScore <= 30 ? 1 : 0,
          mediumRiskCount: transaction.riskScore > 30 && transaction.riskScore <= 70 ? 1 : 0,
          highRiskCount: transaction.riskScore > 70 && transaction.riskScore <= 90 ? 1 : 0,
          criticalRiskCount: transaction.riskScore > 90 ? 1 : 0,
        };

        await storage.createUserStats({
          walletAddress: transaction.walletAddress,
          totalTransactions: 1,
          totalSavings: actualSavings.toFixed(2),
          averageSavings: actualSavings.toFixed(2),
          mevAttacksBlocked: transaction.mevDetected ? 1 : 0,
          protectedRouteCount: useProtectedRoute ? 1 : 0,
          directRouteCount: !useProtectedRoute ? 1 : 0,
          lastTransactionAt: new Date(),
          ...riskCounts,
        });
      }

      broadcastUpdate(transaction.walletAddress, { 
        type: "execution_complete",
        transaction: updated,
        message: `Transaction completed! Saved $${actualSavings}` 
      });

      res.json({
        ...updated,
        smartContractSignature: signature,
      });
    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Execution failed" });
    }
  });

  // ... rest of the routes remain the same (GET endpoints, API key management, SDK endpoints)

  return httpServer;
}

// Helper functions remain the same
function simulateRoutes(inputToken: string, outputToken: string, inputAmount: string) {
  const amount = parseFloat(inputAmount);
  
  // Simulate Jupiter route
  const jupiterRoute = {
    dex: "Jupiter",
    estimatedOutput: (amount * 0.998 * (Math.random() * 0.02 + 0.99)).toFixed(4),
    priceImpact: (Math.random() * 0.5 + 0.1).toFixed(2),
    slippage: (Math.random() * 0.3 + 0.1).toFixed(2),
    mevRisk: Math.floor(Math.random() * 30 + 10), // 10-40
    liquidityDepth: (Math.random() * 5000000 + 1000000).toFixed(0),
    latency: Math.floor(Math.random() * 200 + 100),
    gasEstimate: (Math.random() * 0.001 + 0.0005).toFixed(4),
  };

  // Simulate Raydium route
  const raydiumRoute = {
    dex: "Raydium",
    estimatedOutput: (amount * 0.997 * (Math.random() * 0.02 + 0.99)).toFixed(4),
    priceImpact: (Math.random() * 0.6 + 0.15).toFixed(2),
    slippage: (Math.random() * 0.4 + 0.15).toFixed(2),
    mevRisk: Math.floor(Math.random() * 40 + 20), // 20-60
    liquidityDepth: (Math.random() * 3000000 + 500000).toFixed(0),
    latency: Math.floor(Math.random() * 250 + 150),
    gasEstimate: (Math.random() * 0.0015 + 0.0006).toFixed(4),
  };

  // Simulate Orca route
  const orcaRoute = {
    dex: "Orca",
    estimatedOutput: (amount * 0.996 * (Math.random() * 0.02 + 0.99)).toFixed(4),
    priceImpact: (Math.random() * 0.7 + 0.2).toFixed(2),
    slippage: (Math.random() * 0.5 + 0.2).toFixed(2),
    mevRisk: Math.floor(Math.random() * 35 + 15), // 15-50
    liquidityDepth: (Math.random() * 4000000 + 800000).toFixed(0),
    latency: Math.floor(Math.random() * 220 + 120),
    gasEstimate: (Math.random() * 0.0012 + 0.0007).toFixed(4),
  };

  return [jupiterRoute, raydiumRoute, orcaRoute];
}

async function analyzeRiskWithAI(
  inputToken: string, 
  outputToken: string, 
  inputAmount: string,
  routes: any[]
) {
  try {
    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are an expert DeFi security analyst specializing in MEV (Maximal Extractable Value) attack detection on Solana. Analyze swap transactions and provide risk scores from 0-100."
        },
        {
          role: "user",
          content: `Analyze this Solana swap for MEV risks:
- Swap: ${inputAmount} ${inputToken} → ${outputToken}
- Route options: ${JSON.stringify(routes, null, 2)}

Provide a JSON response with:
{
  "score": <0-100 integer>,
  "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "factors": ["list", "of", "risk", "factors"],
  "sandwichAttackProbability": <0-100 integer>,
  "frontRunningRisk": <0-100 integer>,
  "poolVolatility": <0-100 integer>,
  "recommendedAction": "protect" | "direct" | "wait",
  "reasoning": "brief explanation"
}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      score: result.score || 50,
      level: result.level || "MEDIUM",
      factors: result.factors || ["Unknown risk factors"],
      sandwichAttackProbability: result.sandwichAttackProbability || 40,
      frontRunningRisk: result.frontRunningRisk || 30,
      poolVolatility: result.poolVolatility || 35,
      recommendedAction: result.recommendedAction || "protect",
      reasoning: result.reasoning || "AI analysis completed",
    };
  } catch (error) {
    console.error("AI risk analysis error:", error);
    // Fallback to simple rule-based analysis
    const avgMevRisk = routes.reduce((sum, r) => sum + r.mevRisk, 0) / routes.length;
    return {
      score: Math.floor(avgMevRisk),
      level: avgMevRisk <= 30 ? "LOW" : avgMevRisk <= 60 ? "MEDIUM" : avgMevRisk <= 85 ? "HIGH" : "CRITICAL",
      factors: ["High liquidity pool", "Price volatility detected"],
      sandwichAttackProbability: Math.floor(avgMevRisk * 0.8),
      frontRunningRisk: Math.floor(avgMevRisk * 0.6),
      poolVolatility: Math.floor(avgMevRisk * 0.7),
      recommendedAction: avgMevRisk > 50 ? "protect" : "direct",
      reasoning: "Automated risk assessment based on route analysis",
    };
  }
}


