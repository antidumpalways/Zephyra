import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZephyraBatchCoordinator } from "../target/types/zephyra_batch_coordinator";
import { expect } from "chai";

describe("zephyra-batch-coordinator", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZephyraBatchCoordinator as Program<ZephyraBatchCoordinator>;
  const provider = anchor.getProvider();

  const authority = provider.wallet.publicKey;

  it("Create new batch", async () => {
    const batchAccount = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create batch transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Add transaction to batch", async () => {
    // First create a batch
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add transaction to batch
    const transactionId = Buffer.alloc(32, 2);
    const transactionAccount = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .addToBatch(batchId, transactionId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        transactionAccount: transactionAccount.publicKey,
        authority: authority,
      })
      .rpc();

    console.log("Add transaction to batch signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Execute batch", async () => {
    // Create batch and add transactions
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add a transaction
    const transactionId = Buffer.alloc(32, 2);
    const transactionAccount = anchor.web3.Keypair.generate();

    await program.methods
      .addToBatch(batchId, transactionId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        transactionAccount: transactionAccount.publicKey,
        authority: authority,
      })
      .rpc();

    // Execute batch
    const tx = await program.methods
      .executeBatch(batchId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        authority: authority,
      })
      .rpc();

    console.log("Execute batch transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Get batch status", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Get batch status
    const tx = await program.methods
      .getBatchStatus(batchId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        authority: authority,
      })
      .rpc();

    console.log("Get batch status transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Force execute batch", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Add a transaction
    const transactionId = Buffer.alloc(32, 2);
    const transactionAccount = anchor.web3.Keypair.generate();

    await program.methods
      .addToBatch(batchId, transactionId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        transactionAccount: transactionAccount.publicKey,
        authority: authority,
      })
      .rpc();

    // Force execute batch (simulate time-based execution)
    const tx = await program.methods
      .forceExecuteBatch(batchId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        authority: authority,
      })
      .rpc();

    console.log("Force execute batch transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Cancel batch", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Cancel batch
    const tx = await program.methods
      .cancelBatch(batchId)
      .accounts({
        batchAccount: batchAccount.publicKey,
        authority: authority,
      })
      .rpc();

    console.log("Cancel batch transaction signature", tx);

    expect(tx).to.be.a('string');
  });

  it("Handle batch full error", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to add more than MAX_BATCH_SIZE transactions
    // Note: This test assumes MAX_BATCH_SIZE is 10
    for (let i = 0; i < 11; i++) {
      const transactionId = Buffer.alloc(32, i + 2);
      const transactionAccount = anchor.web3.Keypair.generate();

      try {
        await program.methods
          .addToBatch(batchId, transactionId)
          .accounts({
            batchAccount: batchAccount.publicKey,
            transactionAccount: transactionAccount.publicKey,
            authority: authority,
          })
          .rpc();

        if (i === 10) {
          // Should not reach here
          expect.fail("Expected batch full error");
        }
      } catch (error) {
        if (i === 10) {
          expect(error.message).to.include("BatchFull");
        }
      }
    }
  });

  it("Handle empty batch execution error", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create empty batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to execute empty batch
    try {
      await program.methods
        .executeBatch(batchId)
        .accounts({
          batchAccount: batchAccount.publicKey,
          authority: authority,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected empty batch error");
    } catch (error) {
      expect(error.message).to.include("EmptyBatch");
    }
  });

  it("Handle batch too young error", async () => {
    const batchAccount = anchor.web3.Keypair.generate();
    const batchId = Buffer.alloc(32, 1);

    // Create batch
    await program.methods
      .createBatch()
      .accounts({
        batchAccount: batchAccount.publicKey,
        payer: provider.wallet.publicKey,
        authority: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to force execute immediately (should fail)
    try {
      await program.methods
        .forceExecuteBatch(batchId)
        .accounts({
          batchAccount: batchAccount.publicKey,
          authority: authority,
        })
        .rpc();

      // Should not reach here
      expect.fail("Expected batch too young error");
    } catch (error) {
      expect(error.message).to.include("BatchTooYoung");
    }
  });
});


