import { createZephyraMagicBlockIntegration } from './zephyra-magicblock-integration';
import { createMagicBlockClient } from './magicblock-client';

/**
 * Example: Complete Protected Swap with MagicBlock Ephemeral Rollups
 */
async function exampleProtectedSwap() {
  console.log('='.repeat(60));
  console.log('🛡️  Zephyra + MagicBlock Protected Swap Example');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Initialize integration
    const zephyra = createZephyraMagicBlockIntegration();

    // Check network status
    console.log('📊 Checking MagicBlock network status...');
    const networkStatus = await zephyra.getNetworkStatus();
    console.log(`✅ Network healthy: ${networkStatus.isHealthy}`);
    console.log(`📡 Available ER nodes: ${networkStatus.routes?.nodes?.length || 0}`);
    console.log('');

    // Prepare swap parameters
    const walletAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const inputToken = 'So11111111111111111111111111111111111111112'; // SOL
    const outputToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const inputAmount = 1.0; // 1 SOL

    // Simulated routes from DEXs
    const routes = [
      {
        dex: 'Jupiter' as const,
        estimatedOutput: 0.98,
        priceImpact: 0.5,
        mevRisk: 25,
        liquidityDepth: 1000000,
      },
      {
        dex: 'Raydium' as const,
        estimatedOutput: 0.97,
        priceImpact: 0.75,
        mevRisk: 35,
        liquidityDepth: 800000,
      },
      {
        dex: 'Orca' as const,
        estimatedOutput: 0.975,
        priceImpact: 0.6,
        mevRisk: 30,
        liquidityDepth: 900000,
      },
    ];

    console.log('💱 Swap Details:');
    console.log(`   From: ${inputAmount} SOL`);
    console.log(`   To: USDC`);
    console.log(`   Routes analyzed: ${routes.length}`);
    console.log('');

    // Execute protected swap
    console.log('⚡ Executing protected swap with Ephemeral Rollup...');
    console.log('');

    const result = await zephyra.executeProtectedSwap(
      walletAddress,
      inputToken,
      outputToken,
      inputAmount,
      routes
    );

    // Display results
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ SWAP COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Transaction Details:');
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Signature: ${result.signature}`);
    console.log(`   Proof Hash: ${result.proofHash}`);
    console.log('');
    console.log('💰 Financial Results:');
    console.log(`   Savings: $${result.savings.toFixed(2)}`);
    console.log(`   Protection Fee: $${(result.savings * 0.001).toFixed(2)} (0.1%)`);
    console.log(`   Net Savings: $${(result.savings * 0.999).toFixed(2)}`);
    console.log('');
    console.log('⚡ Performance:');
    console.log(`   Execution Time: ${result.executionTimeMs}ms`);
    console.log(`   Target: <100ms`);
    console.log(`   Status: ${result.executionTimeMs < 100 ? '✅ PASSED' : '⚠️  EXCEEDED'}`);
    console.log('');
    console.log('🔗 Verification:');
    console.log(`   Solana Explorer: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    console.log(`   Proof Verification: Available on-chain`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error executing protected swap:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Example: Check MagicBlock Network Status
 */
async function exampleNetworkStatus() {
  console.log('='.repeat(60));
  console.log('📊 MagicBlock Network Status Check');
  console.log('='.repeat(60));
  console.log('');

  try {
    const magicBlock = createMagicBlockClient();

    // Get routes
    console.log('📡 Fetching available ER routes...');
    const routes = await magicBlock.getRoutes();
    console.log(`✅ Found ${routes.nodes?.length || 0} ER nodes:`);
    routes.nodes?.forEach((node: any, index: number) => {
      console.log(`   ${index + 1}. ${node.region}: ${node.url}`);
    });
    console.log('');

    // Get identity
    console.log('🔐 Fetching ER Validator identity...');
    const identity = await magicBlock.getIdentity();
    console.log(`✅ Validator Identity: ${identity.identity}`);
    console.log('');

    // Test authentication
    console.log('🔑 Testing authentication...');
    const authToken = await magicBlock.getAuthToken();
    console.log(`✅ Auth token obtained: ${authToken.slice(0, 20)}...`);
    console.log('');

    console.log('✅ All network checks passed!');

  } catch (error) {
    console.error('');
    console.error('❌ Network status check failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Example: Batch Execution with MagicBlock
 */
async function exampleBatchExecution() {
  console.log('='.repeat(60));
  console.log('📦 Batch Execution with MagicBlock Example');
  console.log('='.repeat(60));
  console.log('');

  try {
    const zephyra = createZephyraMagicBlockIntegration();

    // Simulate multiple transactions
    const transactions = [
      {
        wallet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inputToken: 'So11111111111111111111111111111111111111112',
        outputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 1.0,
      },
      {
        wallet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inputToken: 'So11111111111111111111111111111111111111112',
        outputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 2.0,
      },
      {
        wallet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inputToken: 'So11111111111111111111111111111111111111112',
        outputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 0.5,
      },
    ];

    console.log(`📦 Batch size: ${transactions.length} transactions`);
    console.log('⚡ Executing batch with Ephemeral Rollup...');
    console.log('');

    const startTime = Date.now();
    const results = await Promise.all(
      transactions.map((tx, index) => {
        console.log(`   Processing transaction ${index + 1}/${transactions.length}...`);
        return zephyra.executeProtectedSwap(
          tx.wallet,
          tx.inputToken,
          tx.outputToken,
          tx.amount,
          [
            {
              dex: 'Jupiter' as const,
              estimatedOutput: tx.amount * 0.98,
              priceImpact: 0.5,
              mevRisk: 25,
              liquidityDepth: 1000000,
            },
          ]
        );
      })
    );
    const executionTime = Date.now() - startTime;

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ BATCH COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Batch Statistics:');
    console.log(`   Total Transactions: ${results.length}`);
    console.log(`   Successful: ${results.length}`);
    console.log(`   Failed: 0`);
    console.log('');
    console.log('💰 Total Savings:');
    const totalSavings = results.reduce((sum, r) => sum + r.savings, 0);
    console.log(`   Amount: $${totalSavings.toFixed(2)}`);
    console.log('');
    console.log('⚡ Performance:');
    console.log(`   Total Execution Time: ${executionTime}ms`);
    console.log(`   Average per Transaction: ${(executionTime / results.length).toFixed(2)}ms`);
    console.log(`   Throughput: ${(results.length / (executionTime / 1000)).toFixed(2)} tx/s`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Batch execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2] || 'swap';

switch (command) {
  case 'swap':
    exampleProtectedSwap();
    break;
  case 'status':
    exampleNetworkStatus();
    break;
  case 'batch':
    exampleBatchExecution();
    break;
  default:
    console.log('Usage: npm run example [swap|status|batch]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run example swap    - Execute protected swap');
    console.log('  npm run example status  - Check network status');
    console.log('  npm run example batch   - Execute batch of transactions');
    process.exit(1);
}


