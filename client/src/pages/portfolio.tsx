import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, ArrowLeft, Package, TrendingUp, Activity, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Batch, Transaction, UserStats } from "@shared/schema";

export default function Portfolio() {
  const [walletAddress] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/stats', walletAddress],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<Batch[]>({
    queryKey: ['/api/batches', walletAddress],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', walletAddress],
  });

  const isLoading = statsLoading || batchesLoading || txLoading;

  const activeBatches = batches?.filter(b => b.status === "pending" || b.status === "processing") || [];
  const completedBatches = batches?.filter(b => b.status === "completed") || [];

  const getBatchTransactions = (batchId: string) => {
    return transactions?.filter(tx => tx.batchId === batchId) || [];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "outline", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <span className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" data-testid="link-logo-dashboard">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-sans font-semibold text-xl tracking-tight">Zephyra</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/swap">
              <Button data-testid="button-new-swap">New Swap</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer" data-testid="link-back-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </span>
            </Link>
            <h1 className="text-4xl font-semibold mb-2" data-testid="heading-portfolio">Portfolio Protection</h1>
            <p className="text-muted-foreground">
              Track batch executions and portfolio-wide MEV protection
            </p>
          </div>

          {/* Portfolio Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6" data-testid="card-active-batches">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Active Batches</div>
                  {isLoading ? (
                    <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold" data-testid="text-active-batches">
                      {activeBatches.length}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    {activeBatches.reduce((sum, b) => sum + b.transactionCount, 0)} pending transactions
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6" data-testid="card-completed-batches">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Completed Batches</div>
                  {isLoading ? (
                    <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold" data-testid="text-completed-batches">
                      {completedBatches.length}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    All time executions
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6" data-testid="card-portfolio-savings">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Portfolio Savings</div>
                  {isLoading ? (
                    <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold text-primary" data-testid="text-portfolio-savings">
                      ${stats?.totalSavings || "0"}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    {stats?.mevAttacksBlocked || 0} MEV attacks blocked
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* Active Batches Section */}
          {activeBatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-active-batches">Active Batches</h2>
              <div className="space-y-4">
                {activeBatches.map((batch) => {
                  const batchTxs = getBatchTransactions(batch.id);
                  return (
                    <Card key={batch.id} className="p-6" data-testid={`card-batch-${batch.id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="w-5 h-5 text-muted-foreground" />
                            <span className="font-mono text-sm text-muted-foreground" data-testid={`text-batch-hash-${batch.id}`}>
                              {batch.batchHash.slice(0, 16)}...
                            </span>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Transactions</div>
                              <div className="text-lg font-semibold" data-testid={`text-batch-tx-count-${batch.id}`}>
                                {batch.transactionCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                              <div className="text-lg font-semibold" data-testid={`text-batch-value-${batch.id}`}>
                                ${batch.totalValue}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Created</div>
                              <div className="text-sm" data-testid={`text-batch-created-${batch.id}`}>
                                {new Date(batch.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {batchTxs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="text-sm font-medium mb-3">Batch Transactions</div>
                          <div className="space-y-2">
                            {batchTxs.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`item-batch-tx-${tx.id}`}>
                                <div className="flex items-center gap-3">
                                  <Activity className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {tx.inputAmount} {tx.inputToken} → {tx.outputToken}
                                  </span>
                                </div>
                                <Badge variant="outline" data-testid={`badge-tx-risk-${tx.id}`}>{tx.riskLevel}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Batches Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-completed-batches">Batch History</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="h-24 bg-muted animate-pulse rounded" />
                  </Card>
                ))}
              </div>
            ) : completedBatches.length === 0 ? (
              <Card className="p-12 text-center" data-testid="card-no-batches">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed batches yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedBatches.map((batch) => {
                  const batchTxs = getBatchTransactions(batch.id);
                  return (
                    <Card key={batch.id} className="p-6" data-testid={`card-completed-batch-${batch.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <span className="font-mono text-sm text-muted-foreground" data-testid={`text-completed-hash-${batch.id}`}>
                              {batch.batchHash.slice(0, 16)}...
                            </span>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Transactions</div>
                              <div className="text-lg font-semibold" data-testid={`text-completed-tx-count-${batch.id}`}>
                                {batch.transactionCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                              <div className="text-lg font-semibold" data-testid={`text-completed-value-${batch.id}`}>
                                ${batch.totalValue}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Execution Time</div>
                              <div className="text-sm flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {batch.executionTime ? `${batch.executionTime}ms` : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Completed</div>
                              <div className="text-sm" data-testid={`text-completed-time-${batch.id}`}>
                                {batch.completedAt ? new Date(batch.completedAt).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {batchTxs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="text-sm font-medium mb-3">{batchTxs.length} Transactions</div>
                          <div className="grid grid-cols-2 gap-2">
                            {batchTxs.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs" data-testid={`item-completed-tx-${tx.id}`}>
                                <span className="truncate">
                                  {tx.inputAmount} {tx.inputToken} → {tx.outputToken}
                                </span>
                                <Badge variant="outline" className="text-xs">{tx.riskLevel}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
