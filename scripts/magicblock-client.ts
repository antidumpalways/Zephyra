import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import fetch from 'node-fetch';

/**
 * MagicBlock Ephemeral Rollups SDK Integration
 * Official integration with MagicBlock API
 */
export class MagicBlockClient {
  private routerUrl: string;
  private connection: Connection;
  private wallet: Keypair;
  private authToken: string | null = null;

  constructor(
    routerUrl: string = 'https://devnet-router.magicblock.app',
    walletPrivateKey?: string
  ) {
    this.routerUrl = routerUrl;
    this.connection = new Connection(routerUrl, 'confirmed');
    
    // Initialize wallet from private key if provided
    if (walletPrivateKey) {
      const secretKey = Buffer.from(walletPrivateKey, 'base64');
      this.wallet = Keypair.fromSecretKey(secretKey);
    } else {
      this.wallet = Keypair.generate();
    }
  }

  /**
   * Get authentication token for Private Ephemeral Rollups
   */
  async getAuthToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      // Step 1: Request challenge
      const challengeResponse = await fetch(`${this.routerUrl}/auth/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: this.wallet.publicKey.toString(),
        }),
      });

      const { challenge } = await challengeResponse.json();

      // Step 2: Sign challenge
      const message = new TextEncoder().encode(challenge);
      const signature = await this.signMessage(message);

      // Step 3: Submit signed challenge
      const tokenResponse = await fetch(`${this.routerUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: this.wallet.publicKey.toString(),
          signature: Buffer.from(signature).toString('base64'),
          challenge,
        }),
      });

      const { token } = await tokenResponse.json();
      this.authToken = token;

      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Sign message with wallet
   */
  private async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return this.wallet.sign(message).signature;
  }

  /**
   * Get account information from Ephemeral Rollup
   */
  async getAccountInfo(accountPubkey: PublicKey) {
    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [
            accountPubkey.toString(),
            {
              encoding: 'jsonParsed',
            },
          ],
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  /**
   * Get signature statuses (check transaction confirmation)
   */
  async getSignatureStatuses(signatures: string[]) {
    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignatureStatuses',
          params: [signatures],
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get signature statuses:', error);
      throw error;
    }
  }

  /**
   * Get blockhash for multiple accounts
   */
  async getBlockhashForAccounts(accounts: PublicKey[]) {
    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBlockhashForAccounts',
          params: [accounts.map(a => a.toString())],
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get blockhash for accounts:', error);
      throw error;
    }
  }

  /**
   * Get available ER nodes from Magic Router
   */
  async getRoutes() {
    try {
      const response = await fetch(`${this.routerUrl}/routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get routes:', error);
      throw error;
    }
  }

  /**
   * Get ER Validator identity
   */
  async getIdentity() {
    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getIdentity',
          params: [],
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get identity:', error);
      throw error;
    }
  }

  /**
   * Check account delegation status
   */
  async getDelegationStatus(accountPubkey: PublicKey) {
    try {
      const response = await fetch(this.routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getDelegationStatus',
          params: [accountPubkey.toString()],
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to get delegation status:', error);
      throw error;
    }
  }

  /**
   * Create Ephemeral Rollup session for transaction
   */
  async createEphemeralSession(accounts: PublicKey[]) {
    try {
      // Get available routes
      const routes = await this.getRoutes();
      
      // Select best route (for now, just use first available)
      const selectedRoute = routes.nodes?.[0] || this.routerUrl;

      // Delegate accounts to ER
      const delegationResults = await Promise.all(
        accounts.map(account => this.getDelegationStatus(account))
      );

      return {
        routerUrl: selectedRoute,
        delegatedAccounts: accounts,
        delegationStatus: delegationResults,
        sessionId: `er-session-${Date.now()}`,
      };
    } catch (error) {
      console.error('Failed to create ephemeral session:', error);
      throw error;
    }
  }

  /**
   * Execute transaction in Ephemeral Rollup
   */
  async executeInEphemeralRollup(
    transaction: any,
    accounts: PublicKey[]
  ) {
    try {
      // Create ephemeral session
      const session = await this.createEphemeralSession(accounts);

      // Send transaction to ER
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        signature,
        'confirmed'
      );

      return {
        signature,
        confirmation,
        session,
      };
    } catch (error) {
      console.error('Failed to execute in ephemeral rollup:', error);
      throw error;
    }
  }

  /**
   * Commit ER state to Solana mainnet
   */
  async commitToMainnet(sessionId: string, accounts: PublicKey[]) {
    try {
      // Get final account states
      const accountStates = await Promise.all(
        accounts.map(account => this.getAccountInfo(account))
      );

      // Commit to mainnet (this would trigger the actual commit process)
      const commitResponse = await fetch(`${this.routerUrl}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          sessionId,
          accounts: accounts.map(a => a.toString()),
          accountStates,
        }),
      });

      const data = await commitResponse.json();
      return data;
    } catch (error) {
      console.error('Failed to commit to mainnet:', error);
      throw error;
    }
  }

  /**
   * Get wallet public key
   */
  getPublicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  /**
   * Get connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

/**
 * Helper function to create MagicBlock client from environment
 */
export function createMagicBlockClient(): MagicBlockClient {
  const routerUrl = process.env.MAGICBLOCK_RPC_URL || 'https://devnet-router.magicblock.app';
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;

  return new MagicBlockClient(routerUrl, walletPrivateKey);
}

export default MagicBlockClient;


