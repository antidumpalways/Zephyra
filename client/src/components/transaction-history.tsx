import { useState } from "react";
import { Eye, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofOfRoute } from "@/components/proof-of-route";
import type { Transaction } from "@shared/schema";

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showProofId, setShowProofId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-state-transactions">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Execute your first protected swap to see it here
        </p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-600 dark:text-green-400 bg-green-500/10";
    if (score <= 70) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10";
    if (score <= 90) return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
    return "text-red-600 dark:text-red-400 bg-red-500/10";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3" data-testid="transaction-history">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="border border-border rounded-lg overflow-hidden hover-elevate"
        >
          <button
            onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
            className="w-full p-4 text-left transition-colors"
            data-testid={`button-transaction-${tx.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-medium">
                    {tx.inputAmount} {tx.inputToken} → {tx.outputAmount} {tx.outputToken}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(tx.riskScore)}`}>
                    Risk: {tx.riskScore}
                  </span>
                  <span className={`text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Via: {tx.selectedRoute}</span>
                  <span>Saved: ${tx.actualSavings}</span>
                  <span>{tx.executionTime}ms</span>
                  <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {expandedId === tx.id ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expanded Details */}
          {expandedId === tx.id && (
            <div className="p-4 border-t border-border bg-card/50">
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="text-sm font-medium mb-2">Transaction Details</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Wallet:</span>
                      <span className="font-mono text-xs">
                        {tx.walletAddress.slice(0, 8)}...{tx.walletAddress.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batch ID:</span>
                      <span className="font-mono text-xs">{tx.batchId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MEV Detected:</span>
                      <span className={tx.mevDetected ? "text-destructive" : "text-green-600 dark:text-green-400"}>
                        {tx.mevDetected ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Protection Stats</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Potential Savings:</span>
                      <span className="font-mono">${tx.potentialSavings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Savings:</span>
                      <span className="font-mono text-primary">${tx.actualSavings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Execution Time:</span>
                      <span className="font-mono">{tx.executionTime}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProofId(showProofId === tx.id ? null : tx.id)}
                  data-testid={`button-view-proof-${tx.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showProofId === tx.id ? "Hide Proof-of-Route" : "View Proof-of-Route"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid={`button-explorer-${tx.id}`}
                >
                  <a
                    href={`https://solscan.io/tx/${tx.proofHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </a>
                </Button>
              </div>

              {/* Proof-of-Route Panel */}
              {showProofId === tx.id && (
                <div className="mt-4">
                  <ProofOfRoute transactionId={tx.id} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
