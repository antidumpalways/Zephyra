import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZephyraProtectionManager } from "../target/types/zephyra_protection_manager";
import { expect } from "chai";

describe("zephyra-protection-manager", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZephyraProtectionManager as Program<ZephyraProtectionManager>;
  const provider = anchor.getProvider();

  // Test wallet
  const walletAddress = anchor.web3.Keypair.generate().publicKey;

  it("Initialize protection account", async () => {
    const [protectionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protection"), walletAddress.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initializeProtection(walletAddress)
      .accounts({
        protectionAccount: protectionAccount,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize protection transaction signature", tx);

    // Fetch the account and verify
    const account = await program.account.protectionAccount.fetch(protectionAccount);
    expect(account.owner.toString()).to.equal(walletAddress.toString());
    expect(account.totalTransactions.toNumber()).to.equal(0);
    expect(account.totalSavings.toNumber()).to.equal(0);
    expect(account.mevAttacksBlocked).to.equal(0);
  });

  it("Submit transaction for protection", async () => {
    const [protectionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protection"), walletAddress.toBuffer()],
      program.programId
    );

    const inputToken = anchor.web3.Keypair.generate().publicKey;
    const outputToken = anchor.web3.Keypair.generate().publicKey;
    const inputAmount = new anchor.BN(1000000); // 1 SOL in lamports
    const minOutputAmount = new anchor.BN(950000); // 0.95 SOL minimum

    const tx = await program.methods
      .submitTransaction(inputToken, outputToken, inputAmount, minOutputAmount)
      .accounts({
        protectionAccount: protectionAccount,
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Submit transaction signature", tx);

    // Verify protection account was updated
    const account = await program.account.protectionAccount.fetch(protectionAccount);
    expect(account.totalTransactions.toNumber()).to.equal(1);
  });

  it("Update protection settings", async () => {
    const [protectionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protection"), walletAddress.toBuffer()],
      program.programId
    );

    const maxSlippage = 200; // 2%
    const maxMevRisk = 75; // 75/100

    const tx = await program.methods
      .updateSettings(maxSlippage, maxMevRisk)
      .accounts({
        protectionAccount: protectionAccount,
        payer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Update settings transaction signature", tx);

    // Verify settings were updated
    const account = await program.account.protectionAccount.fetch(protectionAccount);
    expect(account.settings.maxSlippageBps).to.equal(maxSlippage);
    expect(account.settings.maxMevRiskScore).to.equal(maxMevRisk);
  });

  it("Complete transaction execution", async () => {
    const [protectionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("protection"), walletAddress.toBuffer()],
      program.programId
    );

    // First submit a transaction
    const inputToken = anchor.web3.Keypair.generate().publicKey;
    const outputToken = anchor.web3.Keypair.generate().publicKey;
    const inputAmount = new anchor.BN(1000000);
    const minOutputAmount = new anchor.BN(950000);

    const submitTx = await program.methods
      .submitTransaction(inputToken, outputToken, inputAmount, minOutputAmount)
      .accounts({
        protectionAccount: protectionAccount,
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Get transaction ID from events
    const logs = await provider.connection.getParsedTransaction(submitTx);
    // In a real test, you'd parse the logs to get the transaction ID

    // Complete the transaction
    const outputAmount = new anchor.BN(980000); // 0.98 SOL output
    const proofHash = Buffer.alloc(32, 1); // Mock proof hash

    const completeTx = await program.methods
      .completeTransaction(
        Buffer.alloc(32, 1), // Mock transaction ID
        outputAmount,
        proofHash
      )
      .accounts({
        protectionAccount: protectionAccount,
        transactionAccount: anchor.web3.Keypair.generate().publicKey,
      })
      .rpc();

    console.log("Complete transaction signature", completeTx);

    // Verify protection account was updated with savings
    const account = await program.account.protectionAccount.fetch(protectionAccount);
    expect(account.totalSavings.toNumber()).to.be.greaterThan(0);
  });
});


