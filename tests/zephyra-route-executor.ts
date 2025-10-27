import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZephyraRouteExecutor } from "../target/types/zephyra_route_executor";
import { expect } from "chai";

describe("zephyra-route-executor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZephyraRouteExecutor as Program<ZephyraRouteExecutor>;
  const provider = anchor.getProvider();

  // Mock transaction account
  const transactionId = Buffer.alloc(32, 1);
  const inputToken = anchor.web3.Keypair.generate().publicKey;
  const outputToken = anchor.web3.Keypair.generate().publicKey;
  const inputAmount = new anchor.BN(1000000); // 1 SOL in lamports

  it("Execute Jupiter swap", async () => {
    const routeData = Buffer.from("mock-jupiter-route-data");
    const minOutput = new anchor.BN(950000); // 0.95 SOL minimum

    // Mock transaction account
    const transactionAccount = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .executeJupiterSwap(transactionId, routeData, minOutput)
      .accounts({
        transactionAccount: transactionAccount.publicKey,
        routeExecution: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Execute Jupiter swap transaction signature", tx);

    // Verify the transaction was successful
    expect(tx).to.be.a('string');
  });

  it("Execute Raydium swap", async () => {
    const poolAddress = anchor.web3.Keypair.generate().publicKey;
    const minOutput = new anchor.BN(950000);

    const tx = await program.methods
      .executeRaydiumSwap(transactionId, poolAddress, minOutput)
      .accounts({
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
        routeExecution: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Execute Raydium swap transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Execute Orca swap", async () => {
    const poolAddress = anchor.web3.Keypair.generate().publicKey;
    const minOutput = new anchor.BN(950000);

    const tx = await program.methods
      .executeOrcaSwap(transactionId, poolAddress, minOutput)
      .accounts({
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
        routeExecution: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Execute Orca swap transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Select best route", async () => {
    const routes = [
      {
        dex: { jupiter: {} },
        estimatedOutput: new anchor.BN(980000),
        priceImpactBps: 50,
        mevRiskScore: 25,
        liquidityDepth: new anchor.BN(1000000000),
      },
      {
        dex: { raydium: {} },
        estimatedOutput: new anchor.BN(970000),
        priceImpactBps: 75,
        mevRiskScore: 35,
        liquidityDepth: new anchor.BN(800000000),
      },
      {
        dex: { orca: {} },
        estimatedOutput: new anchor.BN(975000),
        priceImpactBps: 60,
        mevRiskScore: 30,
        liquidityDepth: new anchor.BN(900000000),
      },
    ];

    const tx = await program.methods
      .selectBestRoute(routes)
      .accounts({
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
      })
      .rpc();

    console.log("Select best route transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Handle slippage exceeded error", async () => {
    const routeData = Buffer.from("mock-jupiter-route-data");
    const minOutput = new anchor.BN(2000000); // Very high minimum (2 SOL)

    try {
      await program.methods
        .executeJupiterSwap(transactionId, routeData, minOutput)
        .accounts({
          transactionAccount: anchor.web3.Keypair.generate().publicKey,
          routeExecution: anchor.web3.Keypair.generate().publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected slippage exceeded error");
    } catch (error) {
      expect(error.message).to.include("SlippageExceeded");
    }
  });

  it("Handle empty routes error", async () => {
    try {
      await program.methods
        .selectBestRoute([])
        .accounts({
          transactionAccount: anchor.web3.Keypair.generate().publicKey,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected no routes provided error");
    } catch (error) {
      expect(error.message).to.include("NoRoutesProvided");
    }
  });
});


