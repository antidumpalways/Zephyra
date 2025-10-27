import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZephyraProofVerifier } from "../target/types/zephyra_proof_verifier";
import { expect } from "chai";

describe("zephyra-proof-verifier", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZephyraProofVerifier as Program<ZephyraProofVerifier>;
  const provider = anchor.getProvider();

  const transactionId = Buffer.alloc(32, 1);
  const routesConsidered = [
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
  ];
  const selectedRoute = { jupiter: {} };
  const reasoning = "Selected Jupiter due to optimal MEV risk and output amount";

  it("Generate proof of route", async () => {
    const tx = await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Generate proof transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Verify proof", async () => {
    // First generate a proof
    const proofAccount = anchor.web3.Keypair.generate();
    
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Now verify the proof
    const proofHash = Buffer.alloc(32, 1); // Mock proof hash

    const tx = await program.methods
      .verifyProof(proofHash, transactionId)
      .accounts({
        proofAccount: proofAccount.publicKey,
      })
      .rpc();

    console.log("Verify proof transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Get proof data", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const proofHash = Buffer.alloc(32, 1);

    // Generate proof first
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Get proof data
    const tx = await program.methods
      .getProofData(proofHash)
      .accounts({
        proofAccount: proofAccount.publicKey,
      })
      .rpc();

    console.log("Get proof data transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Add MEV detection to proof", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const proofHash = Buffer.alloc(32, 1);

    // Generate proof first
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add MEV detection
    const attackType = { sandwichAttack: {} };
    const probability = 85;

    const tx = await program.methods
      .addMevDetection(proofHash, attackType, probability)
      .accounts({
        proofAccount: proofAccount.publicKey,
      })
      .rpc();

    console.log("Add MEV detection transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Update execution timing", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const proofHash = Buffer.alloc(32, 1);

    // Generate proof first
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Update timing
    const simulationTime = 50;
    const routeSelectionTime = 30;
    const executionTime = 20;

    const tx = await program.methods
      .updateExecutionTiming(proofHash, simulationTime, routeSelectionTime, executionTime)
      .accounts({
        proofAccount: proofAccount.publicKey,
      })
      .rpc();

    console.log("Update execution timing transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Set blockchain signature", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const proofHash = Buffer.alloc(32, 1);
    const signature = Buffer.alloc(64, 2);

    // Generate proof first
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Set blockchain signature
    const tx = await program.methods
      .setBlockchainSignature(proofHash, signature)
      .accounts({
        proofAccount: proofAccount.publicKey,
      })
      .rpc();

    console.log("Set blockchain signature transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Handle invalid proof hash error", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const invalidProofHash = Buffer.alloc(32, 99);

    try {
      await program.methods
        .verifyProof(invalidProofHash, transactionId)
        .accounts({
          proofAccount: proofAccount.publicKey,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected invalid proof hash error");
    } catch (error) {
      expect(error.message).to.include("InvalidProofHash");
    }
  });

  it("Handle invalid probability error", async () => {
    const proofAccount = anchor.web3.Keypair.generate();
    const proofHash = Buffer.alloc(32, 1);
    const invalidProbability = 150; // > 100

    // Generate proof first
    await program.methods
      .generateProof(transactionId, routesConsidered, selectedRoute, reasoning)
      .accounts({
        proofAccount: proofAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    try {
      await program.methods
        .addMevDetection(proofHash, { sandwichAttack: {} }, invalidProbability)
        .accounts({
          proofAccount: proofAccount.publicKey,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected invalid probability error");
    } catch (error) {
      expect(error.message).to.include("InvalidProbability");
    }
  });
});


