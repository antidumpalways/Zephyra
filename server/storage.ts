import { 
  transactions,
  routeComparisons,
  riskAnalyses,
  proofOfRoutes,
  userStats,
  batches,
  apiKeys,
  type Transaction,
  type InsertTransaction,
  type RouteComparison,
  type InsertRouteComparison,
  type RiskAnalysis,
  type InsertRiskAnalysis,
  type ProofOfRoute,
  type InsertProofOfRoute,
  type UserStats,
  type InsertUserStats,
  type Batch,
  type InsertBatch,
  type ApiKey,
  type InsertApiKey,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Transaction operations
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction>;

  // Route comparison operations
  createRouteComparison(data: InsertRouteComparison): Promise<RouteComparison>;
  getRouteComparisons(transactionId: string): Promise<RouteComparison[]>;

  // Risk analysis operations
  createRiskAnalysis(data: InsertRiskAnalysis): Promise<RiskAnalysis>;
  getRiskAnalysis(transactionId: string): Promise<RiskAnalysis | undefined>;

  // Proof of route operations
  createProofOfRoute(data: InsertProofOfRoute): Promise<ProofOfRoute>;
  getProofOfRoute(transactionId: string): Promise<ProofOfRoute | undefined>;
  getProofByHash(proofHash: string): Promise<ProofOfRoute | undefined>;

  // User statistics operations
  getUserStats(walletAddress: string): Promise<UserStats | undefined>;
  createUserStats(data: InsertUserStats): Promise<UserStats>;
  updateUserStats(walletAddress: string, data: Partial<UserStats>): Promise<UserStats>;

  // Batch operations
  createBatch(data: InsertBatch): Promise<Batch>;
  getBatch(id: string): Promise<Batch | undefined>;
  getPendingBatch(): Promise<Batch | undefined>;
  updateBatch(id: string, data: Partial<Batch>): Promise<Batch>;
  getBatchTransactions(batchId: string): Promise<Transaction[]>;

  // API Key operations
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  getApiKey(key: string): Promise<ApiKey | undefined>;
  getApiKeysByWallet(walletAddress: string): Promise<ApiKey[]>;
  updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Transaction operations
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.walletAddress, walletAddress))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const [updated] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  // Route comparison operations
  async createRouteComparison(data: InsertRouteComparison): Promise<RouteComparison> {
    const [route] = await db
      .insert(routeComparisons)
      .values(data)
      .returning();
    return route;
  }

  async getRouteComparisons(transactionId: string): Promise<RouteComparison[]> {
    return await db
      .select()
      .from(routeComparisons)
      .where(eq(routeComparisons.transactionId, transactionId))
      .orderBy(desc(routeComparisons.mevRisk));
  }

  // Risk analysis operations
  async createRiskAnalysis(data: InsertRiskAnalysis): Promise<RiskAnalysis> {
    const [risk] = await db
      .insert(riskAnalyses)
      .values(data)
      .returning();
    return risk;
  }

  async getRiskAnalysis(transactionId: string): Promise<RiskAnalysis | undefined> {
    const [risk] = await db
      .select()
      .from(riskAnalyses)
      .where(eq(riskAnalyses.transactionId, transactionId));
    return risk || undefined;
  }

  // Proof of route operations
  async createProofOfRoute(data: InsertProofOfRoute): Promise<ProofOfRoute> {
    const [proof] = await db
      .insert(proofOfRoutes)
      .values(data)
      .returning();
    return proof;
  }

  async getProofOfRoute(transactionId: string): Promise<ProofOfRoute | undefined> {
    const [proof] = await db
      .select()
      .from(proofOfRoutes)
      .where(eq(proofOfRoutes.transactionId, transactionId));
    return proof || undefined;
  }

  async getProofByHash(proofHash: string): Promise<ProofOfRoute | undefined> {
    const [proof] = await db
      .select()
      .from(proofOfRoutes)
      .where(eq(proofOfRoutes.proofHash, proofHash));
    return proof || undefined;
  }

  // User statistics operations
  async getUserStats(walletAddress: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.walletAddress, walletAddress));
    return stats || undefined;
  }

  async createUserStats(data: InsertUserStats): Promise<UserStats> {
    const [stats] = await db
      .insert(userStats)
      .values(data)
      .returning();
    return stats;
  }

  async updateUserStats(walletAddress: string, data: Partial<UserStats>): Promise<UserStats> {
    const [updated] = await db
      .update(userStats)
      .set(data)
      .where(eq(userStats.walletAddress, walletAddress))
      .returning();
    return updated;
  }

  // Batch operations
  async createBatch(data: InsertBatch): Promise<Batch> {
    const [batch] = await db
      .insert(batches)
      .values(data)
      .returning();
    return batch;
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db
      .select()
      .from(batches)
      .where(eq(batches.id, id));
    return batch || undefined;
  }

  async getPendingBatch(): Promise<Batch | undefined> {
    const [batch] = await db
      .select()
      .from(batches)
      .where(eq(batches.status, "pending"))
      .orderBy(desc(batches.createdAt))
      .limit(1);
    return batch || undefined;
  }

  async updateBatch(id: string, data: Partial<Batch>): Promise<Batch> {
    const [updated] = await db
      .update(batches)
      .set(data)
      .where(eq(batches.id, id))
      .returning();
    return updated;
  }

  async getBatchTransactions(batchId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.batchId, batchId))
      .orderBy(desc(transactions.createdAt));
  }

  // API Key operations
  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const [key] = await db
      .insert(apiKeys)
      .values(data)
      .returning();
    return key;
  }

  async getApiKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.key, key), eq(apiKeys.active, true)));
    return apiKey || undefined;
  }

  async getApiKeysByWallet(walletAddress: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.walletAddress, walletAddress))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey> {
    const [updated] = await db
      .update(apiKeys)
      .set(data)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated;
  }

  async deleteApiKey(id: string): Promise<void> {
    await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id));
  }
}

export const storage = new DatabaseStorage();
