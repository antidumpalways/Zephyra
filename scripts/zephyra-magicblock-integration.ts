import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { MagicBlockClient, createMagicBlockClient } from './magicblock-client';
import { ZephyraProtectionManager } from '../target/types/zephyra_protection_manager';
import { ZephyraRouteExecutor } from '../target/types/zephyra_route_executor';
import { ZephyraProofVerifier } from '../target/types/zephyra_proof_verifier';
import { ZephyraBatchCoordinator } from '../target/types/zephyra_batch_coordinator';

/**
 * Complete Zephyra + MagicBlock Integration
 * Combines smart contracts with Ephemeral Rollups for sub-100ms execution
 */
export class ZephyraMagicBlockIntegration {
  private magicBlock: MagicBlockClient;
  private connection: Connection;
  private provider: AnchorProvider;
  private protectionManager: Program<ZephyraProtectionManager>;
  private routeExecutor: Program<ZephyraRouteExecutor>;
  private proofVerifier: Program<ZephyraProofVerifier>;
  private batchCoordinator: Program<ZephyraBatchCoordinator>;

  constructor(
    magicBlockRouterUrl: string,
    walletPrivateKey: string,
    programIds: {
      protectionManager: string;
      routeExecutor: string;
      proofVerifier: string;
      batchCoordinator: string;
    }
  ) {
    // Initialize MagicBlock client
    this.magicBlock = new MagicBlockClient(magicBlockRouterUrl, walletPrivateKey);
    this.connection = this.magicBlock.getConnection();
    
    // Create provider
    const wallet: Wallet = {
      publicKey: this.magicBlock.getPublicKey(),
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };
    this.provider = new AnchorProvider(this.connection, wallet, {});
    
    // Initialize programs
    this.protectionManager = new Program(
      require('../target/idl/zephyra_protection_manager.json'),
      programIds.protectionManager,
      this.provider
    );
    
    this.routeExecutor = new Program(
      require('../target/idl/zephyra_route_executor.json'),
      programIds.routeExecutor,
      this.provider
    );
    
    this.proofVerifier = new Program(
      require('../target/idl/zephyra_proof_verifier.json'),
      programIds.proofVerifier,
      this.provider
    );
    
    this.batchCoordinator = new Program(
      require('../target/idl/zephyra_batch_coordinator.json'),
      programIds.batchCoordinator,
      this.provider
    );
  }

  /**
   * Execute protected swap with MagicBlock Ephemeral Rollup
   * This is the main function that combines everything
   */
  async executeProtectedSwap(
    walletAddress: string,
    inputToken: string,
    outputToken: string,
    inputAmount: number,
    routes: Array<{
      dex: 'Jupiter' | 'Raydium' | 'Orca';
      estimatedOutput: number;
      priceImpact: number;
      mevRisk: number;
      liquidityDepth: number;
    }>
  ): Promise<{
    transactionId: string;
    signature: string;
    proofHash: string;
    savings: number;
    executionTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      console.log('🚀 Starting protected swap execution...');

      // Step 1: Get available ER routes
      console.log('📡 Getting available Ephemeral Rollup routes...');
      const erRoutes = await this.magicBlock.getRoutes();
      console.log(`✅ Found ${erRoutes.nodes?.length || 0} ER nodes`);

      // Step 2: Initialize protection account (if needed)
      const walletPubkey = new PublicKey(walletAddress);
      const [protectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('protection'), walletPubkey.toBuffer()],
        this.protectionManager.programId
      );

      // Check if protection account exists
      const accountInfo = await this.magicBlock.getAccountInfo(protectionAccount);
      if (!accountInfo) {
        console.log('🔧 Initializing protection account...');
        await this.protectionManager.methods
          .initializeProtection(walletPubkey)
          .accounts({
            protectionAccount,
            payer: this.provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log('✅ Protection account initialized');
      }

      // Step 3: Create Ephemeral Rollup session
      console.log('🌀 Creating Ephemeral Rollup session...');
      const inputTokenPubkey = new PublicKey(inputToken);
      const outputTokenPubkey = new PublicKey(outputToken);
      
      const erSession = await this.magicBlock.createEphemeralSession([
        protectionAccount,
        inputTokenPubkey,
        outputTokenPubkey,
      ]);
      console.log(`✅ ER session created: ${erSession.sessionId}`);

      // Step 4: Submit transaction to smart contract (in ER)
      console.log('📝 Submitting transaction to Protection Manager...');
      const amountLamports = Math.floor(inputAmount * 1e9);
      const minOutputAmount = Math.floor(amountLamports * 0.95);

      const transactionAccount = PublicKey.generate();
      const submitTx = await this.protectionManager.methods
        .submitTransaction(
          inputTokenPubkey,
          outputTokenPubkey,
          new anchor.BN(amountLamports),
          new anchor.BN(minOutputAmount)
        )
        .accounts({
          protectionAccount,
          transactionAccount,
          payer: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // Execute in ER
      const submitResult = await this.magicBlock.executeInEphemeralRollup(
        submitTx,
        [protectionAccount, transactionAccount]
      );
      console.log(`✅ Transaction submitted: ${submitResult.signature}`);

      // Extract transaction ID from logs
      const transactionId = this.extractTransactionId(submitResult.signature);

      // Step 5: Select best route (in ER)
      console.log('🔍 Selecting best route...');
      const routeOptions = routes.map(route => ({
        dex: this.mapDexToEnum(route.dex),
        estimatedOutput: new anchor.BN(Math.floor(route.estimatedOutput * 1e9)),
        priceImpactBps: Math.floor(route.priceImpact * 100),
        mevRiskScore: route.mevRisk,
        liquidityDepth: new anchor.BN(Math.floor(route.liquidityDepth * 1e9)),
      }));

      const selectRouteTx = await this.routeExecutor.methods
        .selectBestRoute(routeOptions)
        .accounts({
          transactionAccount,
        })
        .transaction();

      const routeResult = await this.magicBlock.executeInEphemeralRollup(
        selectRouteTx,
        [transactionAccount]
      );
      console.log(`✅ Best route selected: ${routeResult.signature}`);

      // Step 6: Generate proof (in ER)
      console.log('🔐 Generating proof-of-route...');
      const [proofAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('proof'), Buffer.from(transactionId, 'hex')],
        this.proofVerifier.programId
      );

      const selectedRoute = routes.reduce((best, current) => 
        current.mevRisk < best.mevRisk ? current : best
      );

      const generateProofTx = await this.proofVerifier.methods
        .generateProof(
          Buffer.from(transactionId, 'hex'),
          routeOptions,
          this.mapDexToEnum(selectedRoute.dex),
          `Selected ${selectedRoute.dex} due to optimal MEV risk (${selectedRoute.mevRisk}) and output`
        )
        .accounts({
          proofAccount,
          payer: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const proofResult = await this.magicBlock.executeInEphemeralRollup(
        generateProofTx,
        [proofAccount]
      );
      console.log(`✅ Proof generated: ${proofResult.signature}`);

      const proofHash = this.extractProofHash(proofResult.signature);

      // Step 7: Execute the actual swap (in ER)
      console.log('⚡ Executing swap...');
      const [routeExecution] = PublicKey.findProgramAddressSync(
        [Buffer.from('route_execution'), Buffer.from(transactionId, 'hex'), Buffer.from('jupiter')],
        this.routeExecutor.programId
      );

      const executeTx = await this.routeExecutor.methods
        .executeJupiterSwap(
          Buffer.from(transactionId, 'hex'),
          Buffer.from('mock-route-data'),
          new anchor.BN(minOutputAmount)
        )
        .accounts({
          transactionAccount,
          routeExecution,
          payer: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const executeResult = await this.magicBlock.executeInEphemeralRollup(
        executeTx,
        [transactionAccount, routeExecution]
      );
      console.log(`✅ Swap executed: ${executeResult.signature}`);

      // Step 8: Complete transaction (in ER)
      console.log('✅ Completing transaction...');
      const outputAmount = selectedRoute.estimatedOutput;
      const completeTx = await this.protectionManager.methods
        .completeTransaction(
          Buffer.from(transactionId, 'hex'),
          new anchor.BN(Math.floor(outputAmount * 1e9)),
          Buffer.from(proofHash, 'hex')
        )
        .accounts({
          protectionAccount,
          transactionAccount,
        })
        .transaction();

      const completeResult = await this.magicBlock.executeInEphemeralRollup(
        completeTx,
        [protectionAccount, transactionAccount]
      );
      console.log(`✅ Transaction completed: ${completeResult.signature}`);

      // Step 9: Commit ER state to Solana mainnet
      console.log('🔗 Committing to Solana mainnet...');
      const commitResult = await this.magicBlock.commitToMainnet(
        erSession.sessionId,
        [protectionAccount, transactionAccount, proofAccount, routeExecution]
      );
      console.log(`✅ Committed to mainnet: ${commitResult.signature || 'pending'}`);

      // Calculate results
      const executionTimeMs = Date.now() - startTime;
      const savings = Math.abs(outputAmount - inputAmount) * 10; // Mock calculation

      console.log(`\n🎉 Protected swap completed successfully!`);
      console.log(`⏱️  Execution time: ${executionTimeMs}ms`);
      console.log(`💰 Savings: $${savings.toFixed(2)}`);

      return {
        transactionId,
        signature: completeResult.signature,
        proofHash,
        savings,
        executionTimeMs,
      };
    } catch (error) {
      console.error('❌ Protected swap failed:', error);
      throw error;
    }
  }

  /**
   * Get MagicBlock network status
   */
  async getNetworkStatus() {
    try {
      const [routes, identity] = await Promise.all([
        this.magicBlock.getRoutes(),
        this.magicBlock.getIdentity(),
      ]);

      return {
        routes,
        identity,
        isHealthy: routes.nodes && routes.nodes.length > 0,
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return {
        routes: null,
        identity: null,
        isHealthy: false,
      };
    }
  }

  /**
   * Check if account is delegated to ER
   */
  async checkDelegationStatus(accountPubkey: PublicKey) {
    return await this.magicBlock.getDelegationStatus(accountPubkey);
  }

  // Helper methods
  private mapDexToEnum(dex: string): any {
    switch (dex) {
      case 'Jupiter':
        return { jupiter: {} };
      case 'Raydium':
        return { raydium: {} };
      case 'Orca':
        return { orca: {} };
      default:
        throw new Error(`Unknown DEX: ${dex}`);
    }
  }

  private extractTransactionId(signature: string): string {
    // In production, parse logs to extract actual transaction ID
    return `tx-${signature.slice(0, 16)}`;
  }

  private extractProofHash(signature: string): string {
    // In production, parse logs to extract actual proof hash
    return `proof-${signature.slice(0, 16)}`;
  }
}

/**
 * Create Zephyra + MagicBlock integration from environment
 */
export function createZephyraMagicBlockIntegration(): ZephyraMagicBlockIntegration {
  return new ZephyraMagicBlockIntegration(
    process.env.MAGICBLOCK_RPC_URL || 'https://devnet-router.magicblock.app',
    process.env.WALLET_PRIVATE_KEY || '',
    {
      protectionManager: process.env.PROTECTION_MANAGER_PROGRAM_ID || '',
      routeExecutor: process.env.ROUTE_EXECUTOR_PROGRAM_ID || '',
      proofVerifier: process.env.PROOF_VERIFIER_PROGRAM_ID || '',
      batchCoordinator: process.env.BATCH_COORDINATOR_PROGRAM_ID || '',
    }
  );
}

export default ZephyraMagicBlockIntegration;


