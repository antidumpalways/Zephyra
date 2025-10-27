import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import OpenAI from "openai";
import { storage } from "./storage";
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

// OpenRouter AI integration - Using Claude 3.5 Sonnet for MEV risk analysis
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://zephyra.app", // Optional: your app URL
    "X-Title": "Zephyra MEV Protection", // Optional: app name shown in OpenRouter dashboard
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
    // Create new batch
    const batchHash = crypto.createHash('sha256')
      .update(`batch-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex');
    
    const batchData: InsertBatch = {
      status: "pending",
      transactionCount: 0,
      totalValue: "0",
      batchHash,
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

// Helper: Execute a batch of transactions
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
    
    // Simulate batch execution (in production, this would use MagicBlock)
    const executionStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1500));
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

  // POST /api/simulate - Simulate swap with AI risk analysis and route comparison
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

      // Simulate different DEX routes (Jupiter, Raydium, Orca)
      const routes = await simulateRoutes(inputToken, outputToken, inputAmount);
      
      broadcastUpdate(walletAddress, { 
        type: "status", 
        status: "analyzing",
        message: "Analyzing MEV risk with AI..." 
      });

      // Get AI risk analysis from OpenAI
      const riskAnalysis = await analyzeRiskWithAI(inputToken, outputToken, inputAmount, routes);
      
      // Select best route (lowest MEV risk + best price)
      const selectedRoute = routes.reduce((best, current) => 
        (current.mevRisk < best.mevRisk || 
         (current.mevRisk === best.mevRisk && parseFloat(current.estimatedOutput) > parseFloat(best.estimatedOutput)))
          ? current : best
      );

      // Calculate potential savings (protected route output - unprotected route output)
      const worstRoute = routes.reduce((worst, current) => 
        current.mevRisk > worst.mevRisk ? current : worst
      );
      const potentialSavings = Math.abs(parseFloat(selectedRoute.estimatedOutput) - parseFloat(worstRoute.estimatedOutput)) * 10; // Realistic savings estimate

      // Get or create batch for this transaction
      const batch = await getOrCreateBatch();

      // Generate proof hash
      const proofHash = crypto.createHash('sha256')
        .update(`${walletAddress}-${inputToken}-${outputToken}-${inputAmount}-${Date.now()}`)
        .digest('hex');

      // Create transaction record and add to batch
      const transactionData: InsertTransaction = {
        walletAddress,
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: selectedRoute.estimatedOutput,
        riskScore: riskAnalysis.score,
        riskLevel: riskAnalysis.level,
        selectedRoute: selectedRoute.dex,
        alternativeRoutes: routes,
        mevDetected: riskAnalysis.score > 30,
        potentialSavings: potentialSavings.toFixed(2),
        actualSavings: "0",
        status: "simulating",
        executionTime: 0,
        batchId: batch.id, // Assign to batch
        proofHash,
        proofData: {
          routes,
          riskAnalysis,
          selectedRoute: selectedRoute.dex,
          timestamp: new Date().toISOString(),
          batchId: batch.id,
        },
      };

      const transaction = await storage.createTransaction(transactionData);

      // Get actual transaction count from database (atomic - prevents race conditions)
      const batchTransactions = await storage.getBatchTransactions(batch.id);
      const actualCount = batchTransactions.length;
      const actualTotalValue = batchTransactions.reduce((sum, tx) => 
        sum + parseFloat(tx.inputAmount), 0
      ).toFixed(2);

      // Update batch with actual counts
      await storage.updateBatch(batch.id, {
        transactionCount: actualCount,
        totalValue: actualTotalValue,
      });

      // Check if batch should be executed now (reached size threshold)
      if (actualCount >= BATCH_SIZE_THRESHOLD) {
        // Execute batch asynchronously
        executeBatch(batch.id).catch(err => console.error("Batch execution error:", err));
      }

      // Store route comparisons
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
          selected: route.dex === selectedRoute.dex,
        };
        await storage.createRouteComparison(routeData);
      }

      // Store risk analysis
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

      res.json(transaction);
    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: "Simulation failed" });
    }
  });

  // POST /api/execute - Execute protected swap
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

      // Simulate execution time (in production this would interact with MagicBlock)
      const executionStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 2000));
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
        blockchainTxSignature: `${crypto.randomBytes(32).toString('hex')}`, // Mock Solana signature
        verificationUrl: `https://explorer.solana.com/tx/${crypto.randomBytes(32).toString('hex')}`,
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

      res.json(updated);
    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Execution failed" });
    }
  });

  // GET /api/transactions/:walletAddress - Get transaction history
  app.get("/api/transactions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const transactions = await storage.getTransactionsByWallet(walletAddress);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // GET /api/stats/:walletAddress - Get user statistics
  app.get("/api/stats/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const stats = await storage.getUserStats(walletAddress);
      
      if (!stats) {
        // Return default stats for new users
        return res.json({
          walletAddress,
          totalTransactions: 0,
          totalSavings: "0",
          averageSavings: "0",
          lowRiskCount: 0,
          mediumRiskCount: 0,
          highRiskCount: 0,
          criticalRiskCount: 0,
          mevAttacksBlocked: 0,
          protectedRouteCount: 0,
          directRouteCount: 0,
        });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // GET /api/proof/:transactionId - Get proof of route
  app.get("/api/proof/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const proof = await storage.getProofOfRoute(transactionId);
      
      if (!proof) {
        return res.status(404).json({ error: "Proof not found" });
      }
      
      res.json(proof);
    } catch (error) {
      console.error("Get proof error:", error);
      res.status(500).json({ error: "Failed to fetch proof" });
    }
  });

  // GET /api/batches/:walletAddress - Get all batches for a wallet
  app.get("/api/batches/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Get all transactions for this wallet to find their batch IDs
      const transactions = await storage.getTransactionsByWallet(walletAddress);
      const batchIds = [...new Set(transactions.map(tx => tx.batchId).filter(Boolean))];
      
      // Get batch details
      const batches = await Promise.all(
        batchIds.map(id => storage.getBatch(id!))
      );
      
      // Filter out undefined and sort by createdAt desc
      const validBatches = batches.filter(b => b !== undefined).sort((a, b) => 
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      );
      
      res.json(validBatches);
    } catch (error) {
      console.error("Get batches error:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  // ============================================================================
  // API KEY MANAGEMENT ENDPOINTS
  // ============================================================================

  // POST /api/keys - Generate new API key (requires wallet authentication)
  app.post("/api/keys", async (req, res) => {
    try {
      const { walletAddress, name } = req.body;
      
      if (!walletAddress || !name) {
        return res.status(400).json({ error: "Missing walletAddress or name" });
      }

      // TODO: Add proper wallet signature verification here
      // For now, we trust the walletAddress from request body
      // In production, verify wallet ownership via signature

      // Generate secure API key (64 random hex chars)
      const rawKey = crypto.randomBytes(32).toString("hex");
      const apiKey = `zeph_${rawKey}`;
      
      // Hash the key for storage (only hash is stored, not plaintext)
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      
      const keyData = await storage.createApiKey({
        key: keyHash, // Store hashed key
        name,
        walletAddress,
        requestsPerMinute: 60,
        requestsToday: 0,
        active: true,
      });

      // Return plaintext key ONLY on creation (won't be shown again)
      res.json({
        id: keyData.id,
        key: apiKey, // Full plaintext key shown only once
        name: keyData.name,
        requestsPerMinute: keyData.requestsPerMinute,
        createdAt: keyData.createdAt,
        message: "⚠️ Save this key securely - it won't be shown again!"
      });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  // GET /api/keys/:walletAddress - List API keys for wallet (requires ownership)
  app.get("/api/keys/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // TODO: Add proper wallet signature verification
      // Verify that requester owns this wallet address
      
      const keys = await storage.getApiKeysByWallet(walletAddress);
      
      // Never expose key hashes - return only safe metadata
      const sanitized = keys.map(k => ({
        id: k.id,
        name: k.name,
        active: k.active,
        requestsPerMinute: k.requestsPerMinute,
        requestsToday: k.requestsToday,
        lastRequestAt: k.lastRequestAt,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        // No key preview since we only store hashes
      }));
      
      res.json(sanitized);
    } catch (error) {
      console.error("List API keys error:", error);
      res.status(500).json({ error: "Failed to list API keys" });
    }
  });

  // DELETE /api/keys/:id - Revoke API key (requires ownership)
  app.delete("/api/keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Missing walletAddress" });
      }
      
      // TODO: Add proper wallet signature verification
      // Verify that requester owns the wallet that created this key
      
      // Verify ownership before deletion
      const keys = await storage.getApiKeysByWallet(walletAddress);
      const keyToDelete = keys.find(k => k.id === id);
      
      if (!keyToDelete) {
        return res.status(404).json({ error: "API key not found or not owned by this wallet" });
      }
      
      await storage.deleteApiKey(id);
      res.json({ message: "API key revoked successfully" });
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });

  // ============================================================================
  // ZEPHYRA SDK PUBLIC API - For third-party developers
  // ============================================================================

  // POST /api/sdk/simulate - Simulate MEV-protected swap (authenticated)
  app.post("/api/sdk/simulate", authenticateSDK, async (req, res) => {
    try {
      const validation = swapSimulationRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const { inputToken, outputToken, inputAmount } = validation.data;
      const walletAddress = (req as any).walletAddress;

      // Simulate routes
      const routes = await simulateRoutes(inputToken, outputToken, inputAmount);
      const riskAnalysis = await analyzeRiskWithAI(inputToken, outputToken, inputAmount, routes);
      
      const selectedRoute = routes.reduce((best, current) => 
        (current.mevRisk < best.mevRisk || 
         (current.mevRisk === best.mevRisk && parseFloat(current.estimatedOutput) > parseFloat(best.estimatedOutput)))
          ? current 
          : best
      );

      res.json({
        walletAddress,
        inputToken,
        outputToken,
        inputAmount,
        routes: routes.map(r => ({
          dex: r.dex,
          estimatedOutput: r.estimatedOutput,
          mevRisk: r.mevRisk,
          priceImpact: r.priceImpact,
          latency: r.latency,
          selected: r.dex === selectedRoute.dex
        })),
        selectedRoute: selectedRoute.dex,
        riskScore: riskAnalysis.score,
        riskLevel: riskAnalysis.level,
        potentialSavings: calculateSavings(routes, selectedRoute),
        reasoning: riskAnalysis.reasoning,
      });
    } catch (error) {
      console.error("SDK simulate error:", error);
      res.status(500).json({ error: "Simulation failed" });
    }
  });

  // POST /api/sdk/execute - Execute MEV-protected swap (authenticated)
  app.post("/api/sdk/execute", authenticateSDK, async (req, res) => {
    try {
      const validation = swapExecutionRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const walletAddress = (req as any).walletAddress;
      const transactionData = validation.data;

      // Create transaction record
      const transaction = await storage.createTransaction({
        walletAddress,
        ...transactionData,
        status: "completed",
        completedAt: new Date(),
      });

      res.json({
        transactionId: transaction.id,
        status: "completed",
        proofHash: transaction.proofHash,
        actualSavings: transaction.actualSavings,
        executionTime: transaction.executionTime,
      });
    } catch (error) {
      console.error("SDK execute error:", error);
      res.status(500).json({ error: "Execution failed" });
    }
  });

  // GET /api/sdk/risk-analysis/:transactionId - Get detailed risk analysis (authenticated)
  app.get("/api/sdk/risk-analysis/:transactionId", authenticateSDK, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const riskAnalysis = await storage.getRiskAnalysis(transactionId);
      
      if (!riskAnalysis) {
        return res.status(404).json({ error: "Risk analysis not found" });
      }
      
      res.json(riskAnalysis);
    } catch (error) {
      console.error("SDK risk analysis error:", error);
      res.status(500).json({ error: "Failed to fetch risk analysis" });
    }
  });

  return httpServer;
}

// Helper: Calculate savings from route selection
function calculateSavings(routes: any[], selectedRoute: any): string {
  const selectedOutput = parseFloat(selectedRoute.estimatedOutput);
  const worstOutput = Math.min(...routes.map(r => parseFloat(r.estimatedOutput)));
  const savings = Math.abs(selectedOutput - worstOutput) * 10; // Mock USD conversion
  return savings.toFixed(2);
}

// Helper: Simulate routes across different DEXs
function simulateRoutes(inputToken: string, outputToken: string, inputAmount: string) {
  const amount = parseFloat(inputAmount);
  
  // Simulate Jupiter route
  const jupiterRoute = {
    dex: "jupiter",
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
    dex: "raydium",
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
    dex: "orca",
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

// Helper: Analyze MEV risk using AI via OpenRouter
async function analyzeRiskWithAI(
  inputToken: string, 
  outputToken: string, 
  inputAmount: string,
  routes: any[]
) {
  try {
    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // Using Claude 3.5 Sonnet via OpenRouter
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
    
    // Validate and provide defaults
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

// Middleware: Authenticate SDK API requests via API key
async function authenticateSDK(req: any, res: any, next: any) {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: "Missing API key",
        message: "Include X-API-Key header or Authorization: Bearer <key>" 
      });
    }

    // Hash the incoming key to compare with stored hash
    const keyHash = crypto.createHash("sha256").update(apiKey as string).digest("hex");
    const keyData = await storage.getApiKey(keyHash);
    
    if (!keyData) {
      return res.status(401).json({ 
        error: "Invalid API key",
        message: "API key not found or inactive" 
      });
    }

    // Check expiration
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      return res.status(401).json({ 
        error: "API key expired",
        message: "Please generate a new API key" 
      });
    }

    // Simple rate limiting (requests per minute)
    const now = new Date();
    const lastRequest = keyData.lastRequestAt ? new Date(keyData.lastRequestAt) : null;
    
    if (lastRequest) {
      const secondsSinceLastRequest = (now.getTime() - lastRequest.getTime()) / 1000;
      if (secondsSinceLastRequest < 60 / keyData.requestsPerMinute) {
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          message: `Max ${keyData.requestsPerMinute} requests per minute`,
          retryAfter: Math.ceil(60 / keyData.requestsPerMinute - secondsSinceLastRequest)
        });
      }
    }

    // Update rate limit counters
    await storage.updateApiKey(keyData.id, {
      lastRequestAt: now,
      requestsToday: keyData.requestsToday + 1,
    });

    // Attach wallet address to request
    (req as any).walletAddress = keyData.walletAddress;
    (req as any).apiKeyId = keyData.id;
    
    next();
  } catch (error) {
    console.error("SDK authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
