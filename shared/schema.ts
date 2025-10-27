import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ZEPHYRA DATA MODELS
// AI-Powered MEV Protection Platform for Solana DeFi
// ============================================================================

// Transaction Model - Stores protected swap transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  
  // Transaction Details
  inputToken: text("input_token").notNull(), // e.g., "SOL"
  outputToken: text("output_token").notNull(), // e.g., "USDC"
  inputAmount: text("input_amount").notNull(), // Stored as string to avoid precision issues
  outputAmount: text("output_amount").notNull(),
  
  // Risk Analysis
  riskScore: integer("risk_score").notNull(), // 0-100
  riskLevel: text("risk_level").notNull(), // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  
  // Route Information
  selectedRoute: text("selected_route").notNull(), // "jupiter" | "raydium" | "orca"
  alternativeRoutes: jsonb("alternative_routes").notNull(), // Array of route comparisons
  
  // MEV Protection
  mevDetected: boolean("mev_detected").notNull().default(false),
  potentialSavings: text("potential_savings").notNull(), // USD amount saved
  actualSavings: text("actual_savings").notNull(),
  
  // Execution Details
  status: text("status").notNull(), // "simulating" | "analyzing" | "executing" | "completed" | "failed"
  executionTime: integer("execution_time").notNull(), // in milliseconds
  batchId: text("batch_id"), // If batched with other transactions
  
  // Proof of Route
  proofHash: text("proof_hash").notNull().unique(), // Verifiable hash
  proofData: jsonb("proof_data").notNull(), // Full route selection reasoning
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Route Comparison Model - Stores DEX route analysis
export const routeComparisons = pgTable("route_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull(),
  
  // Route Details
  dex: text("dex").notNull(), // "jupiter" | "raydium" | "orca"
  estimatedOutput: text("estimated_output").notNull(),
  priceImpact: text("price_impact").notNull(), // Percentage
  slippage: text("slippage").notNull(), // Percentage
  
  // MEV Analysis
  mevRisk: integer("mev_risk").notNull(), // 0-100
  liquidityDepth: text("liquidity_depth").notNull(),
  
  // Performance
  latency: integer("latency").notNull(), // in ms
  gasEstimate: text("gas_estimate").notNull(),
  
  selected: boolean("selected").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Risk Analysis Model - Detailed AI risk assessment
export const riskAnalyses = pgTable("risk_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull(),
  
  // AI Analysis
  aiModel: text("ai_model").notNull(), // "gpt-5"
  riskScore: integer("risk_score").notNull(), // 0-100
  riskFactors: jsonb("risk_factors").notNull(), // Array of identified risks
  
  // Detection Results
  sandwichAttackProbability: integer("sandwich_attack_probability").notNull(), // 0-100
  frontRunningRisk: integer("front_running_risk").notNull(), // 0-100
  poolVolatility: integer("pool_volatility").notNull(), // 0-100
  
  // Recommendations
  recommendedAction: text("recommended_action").notNull(), // "protect" | "direct" | "wait"
  reasoning: text("reasoning").notNull(), // AI explanation
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proof of Route Model - Transparency layer for audit
export const proofOfRoutes = pgTable("proof_of_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull().unique(),
  proofHash: text("proof_hash").notNull().unique(),
  
  // Route Selection Process
  routesConsidered: jsonb("routes_considered").notNull(), // All routes analyzed
  selectionReasoning: jsonb("selection_reasoning").notNull(), // Why chosen route won
  
  // MEV Protection Log
  mevDetectionLog: jsonb("mev_detection_log").notNull(), // Timestamp + detected threats
  protectionMeasures: jsonb("protection_measures").notNull(), // What we did to protect
  
  // Execution Timeline
  simulationTime: integer("simulation_time").notNull(), // ms
  routeSelectionTime: integer("route_selection_time").notNull(), // ms
  executionTime: integer("execution_time").notNull(), // ms
  totalTime: integer("total_time").notNull(), // ms
  
  // Verifiability
  blockchainTxSignature: text("blockchain_tx_signature"), // Solana tx signature
  verificationUrl: text("verification_url"), // Link to Solana Explorer
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Batch Model - Group transactions for efficient execution
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Batch Details
  status: text("status").notNull(), // "pending" | "processing" | "completed" | "failed"
  transactionCount: integer("transaction_count").notNull().default(0),
  totalValue: text("total_value").notNull().default("0"), // Total USD value
  
  // Execution Details
  executionTime: integer("execution_time"), // in milliseconds
  batchHash: text("batch_hash").notNull().unique(), // Verifiable batch hash
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
});

// User Statistics Model - Track savings and protection stats
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  
  // Aggregate Statistics
  totalTransactions: integer("total_transactions").notNull().default(0),
  totalSavings: text("total_savings").notNull().default("0"), // USD
  averageSavings: text("average_savings").notNull().default("0"), // USD per transaction
  
  // Risk Distribution
  lowRiskCount: integer("low_risk_count").notNull().default(0),
  mediumRiskCount: integer("medium_risk_count").notNull().default(0),
  highRiskCount: integer("high_risk_count").notNull().default(0),
  criticalRiskCount: integer("critical_risk_count").notNull().default(0),
  
  // Protection Stats
  mevAttacksBlocked: integer("mev_attacks_blocked").notNull().default(0),
  protectedRouteCount: integer("protected_route_count").notNull().default(0),
  directRouteCount: integer("direct_route_count").notNull().default(0),
  
  lastTransactionAt: timestamp("last_transaction_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertRouteComparisonSchema = createInsertSchema(routeComparisons).omit({
  id: true,
  createdAt: true,
});

export const insertRiskAnalysisSchema = createInsertSchema(riskAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertProofOfRouteSchema = createInsertSchema(proofOfRoutes).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTransactionAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  executedAt: true,
  completedAt: true,
});

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Swap Simulation Request
export const swapSimulationRequestSchema = z.object({
  walletAddress: z.string(),
  inputToken: z.string(),
  outputToken: z.string(),
  inputAmount: z.string(),
});

// Swap Execution Request
export const swapExecutionRequestSchema = z.object({
  transactionId: z.string(),
  useProtectedRoute: z.boolean(),
});

// Risk Score Response
export const riskScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  factors: z.array(z.string()),
  reasoning: z.string(),
  recommendedAction: z.enum(["protect", "direct", "wait"]),
});

// Route Comparison Response
export const routeComparisonResponseSchema = z.object({
  dex: z.string(),
  estimatedOutput: z.string(),
  priceImpact: z.string(),
  slippage: z.string(),
  mevRisk: z.number(),
  latency: z.number(),
  selected: z.boolean(),
});

// API Keys Model - For SDK authentication
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // Encrypted API key
  name: text("name").notNull(), // Human-readable name (e.g., "My App Integration")
  walletAddress: text("wallet_address").notNull(), // Owner of this API key
  
  // Rate Limiting
  requestsPerMinute: integer("requests_per_minute").notNull().default(60),
  requestsToday: integer("requests_today").notNull().default(0),
  lastRequestAt: timestamp("last_request_at"),
  
  // Status
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type RouteComparison = typeof routeComparisons.$inferSelect;
export type InsertRouteComparison = z.infer<typeof insertRouteComparisonSchema>;

export type RiskAnalysis = typeof riskAnalyses.$inferSelect;
export type InsertRiskAnalysis = z.infer<typeof insertRiskAnalysisSchema>;

export type ProofOfRoute = typeof proofOfRoutes.$inferSelect;
export type InsertProofOfRoute = z.infer<typeof insertProofOfRouteSchema>;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type SwapSimulationRequest = z.infer<typeof swapSimulationRequestSchema>;
export type SwapExecutionRequest = z.infer<typeof swapExecutionRequestSchema>;
export type RiskScoreResponse = z.infer<typeof riskScoreResponseSchema>;
export type RouteComparisonResponse = z.infer<typeof routeComparisonResponseSchema>;
