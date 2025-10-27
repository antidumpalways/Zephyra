import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, TrendingUp, Activity, Eye, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TransactionHistory } from "@/components/transaction-history";
import { SavingsChart } from "@/components/savings-chart";
import { useWebSocket } from "@/hooks/use-websocket";
import type { UserStats, Transaction } from "@shared/schema";

export default function Dashboard() {
  const [walletAddress] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mock for demo

  // Connect WebSocket for real-time updates
  const { isConnected } = useWebSocket({ walletAddress });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/stats', walletAddress],
  });

  // Fetch transaction history
  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', walletAddress],
  });

  const isLoading = statsLoading || txLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" data-testid="link-logo-home">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-sans font-semibold text-xl tracking-tight">Zephyra</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="status-websocket">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live</span>
              </div>
            )}
            <Link href="/portfolio">
              <Button variant="outline" data-testid="button-portfolio">Portfolio</Button>
            </Link>
            <Link href="/swap">
              <Button data-testid="button-new-swap">
                <Plus className="w-4 h-4 mr-2" />
                New Swap
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer" data-testid="link-back-home">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </span>
            </Link>
            <h1 className="text-4xl font-semibold mb-2" data-testid="heading-dashboard">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your savings and transaction history
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6" data-testid="card-total-savings">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Savings</div>
                  {isLoading ? (
                    <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold text-primary" data-testid="text-total-savings">
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
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    {stats?.totalTransactions || 0} transactions protected
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6" data-testid="card-avg-savings">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Avg. per Transaction</div>
                  {isLoading ? (
                    <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold" data-testid="text-avg-savings">
                      ${stats?.averageSavings || "0"}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    10-15% average protection rate
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6" data-testid="card-mev-blocked">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">MEV Attacks Blocked</div>
                  {isLoading ? (
                    <div className="h-10 w-20 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-mono font-semibold text-destructive" data-testid="text-mev-blocked">
                      {stats?.mevAttacksBlocked || 0}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                ) : (
                  <span>
                    {stats?.protectedRouteCount || 0} protected routes used
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* Savings Chart */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Savings Over Time</h2>
                <p className="text-sm text-muted-foreground">Cumulative USD saved from MEV protection</p>
              </div>
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
            <SavingsChart transactions={transactions || []} isLoading={isLoading} />
          </Card>

          {/* Risk Distribution */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Risk Distribution</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20" data-testid="card-risk-low">
                  <div className="text-2xl font-mono font-semibold text-green-600 dark:text-green-400 mb-1">
                    {stats?.lowRiskCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Risk (0-30)</div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20" data-testid="card-risk-medium">
                  <div className="text-2xl font-mono font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                    {stats?.mediumRiskCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium (31-70)</div>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20" data-testid="card-risk-high">
                  <div className="text-2xl font-mono font-semibold text-orange-600 dark:text-orange-400 mb-1">
                    {stats?.highRiskCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">High (71-90)</div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="card-risk-critical">
                  <div className="text-2xl font-mono font-semibold text-red-600 dark:text-red-400 mb-1">
                    {stats?.criticalRiskCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical (91-100)</div>
                </div>
              </div>
            )}
          </Card>

          {/* Transaction History */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
            <TransactionHistory transactions={transactions || []} isLoading={isLoading} />
          </Card>
        </div>
      </div>
    </div>
  );
}
