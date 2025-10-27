import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ExternalLink, Copy, CheckCircle2, Clock, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ProofOfRoute as ProofOfRouteType } from "@shared/schema";

interface ProofOfRouteProps {
  transactionId: string;
}

export function ProofOfRoute({ transactionId }: ProofOfRouteProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: proof, isLoading } = useQuery<ProofOfRouteType>({
    queryKey: ['/api/proof', transactionId],
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Proof hash copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-32 bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  if (!proof) {
    return null;
  }

  const routesConsidered = proof.routesConsidered as any[];
  const selectionReasoning = proof.selectionReasoning as any;
  const mevDetectionLog = proof.mevDetectionLog as any[];
  const protectionMeasures = proof.protectionMeasures as any[];

  return (
    <Card className="p-6" data-testid="proof-of-route-panel">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
        data-testid="button-toggle-proof"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h2 className="text-xl font-semibold">Proof-of-Route</h2>
            <p className="text-sm text-muted-foreground">
              Verifiable transparency layer • Executed in {proof.totalTime}ms
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Proof Hash */}
          <div>
            <div className="text-sm font-medium mb-2">Verifiable Proof Hash</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded bg-muted font-mono text-xs break-all">
                {proof.proofHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(proof.proofHash)}
                data-testid="button-copy-hash"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Routes Considered */}
          <div>
            <div className="text-sm font-medium mb-3">Route Analysis</div>
            <div className="space-y-2">
              {routesConsidered?.map((route: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-card-foreground/5 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{route.dex}</span>
                    {route.selected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>Output: {route.output}</div>
                    <div>MEV Risk: {route.mevRisk}/100</div>
                    <div>Impact: {route.priceImpact}%</div>
                    <div>Latency: {route.latency}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selection Reasoning */}
          <div>
            <div className="text-sm font-medium mb-3">Why This Route Was Chosen</div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm">{selectionReasoning?.reasoning || "Best balance of output, MEV protection, and execution speed."}</p>
              {selectionReasoning?.factors && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {selectionReasoning.factors.map((factor: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* MEV Detection Log */}
          {mevDetectionLog && mevDetectionLog.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-3">MEV Threat Detection</div>
              <div className="space-y-2">
                {mevDetectionLog.map((log: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-destructive mt-0.5" />
                      <div>
                        <div className="font-medium text-destructive">{log.threat}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Detected at: {log.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Protection Measures */}
          {protectionMeasures && protectionMeasures.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-3">Protection Applied</div>
              <div className="space-y-2">
                {protectionMeasures.map((measure: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Shield className="w-4 h-4 text-primary mt-0.5" />
                    <span>{measure}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Timeline */}
          <div>
            <div className="text-sm font-medium mb-3">Execution Timeline</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-card-foreground/5">
                <span className="text-sm">Simulation</span>
                <span className="font-mono text-sm">{proof.simulationTime}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-card-foreground/5">
                <span className="text-sm">Route Selection</span>
                <span className="font-mono text-sm">{proof.routeSelectionTime}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-card-foreground/5">
                <span className="text-sm">Execution</span>
                <span className="font-mono text-sm">{proof.executionTime}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/20 font-medium">
                <span className="text-sm">Total Time</span>
                <span className="font-mono text-sm text-primary">{proof.totalTime}ms</span>
              </div>
            </div>
          </div>

          {/* Blockchain Verification */}
          {proof.blockchainTxSignature && (
            <div>
              <div className="text-sm font-medium mb-2">Blockchain Verification</div>
              <Button
                variant="outline"
                asChild
                className="w-full"
                data-testid="button-view-on-explorer"
              >
                <a
                  href={proof.verificationUrl || `https://solscan.io/tx/${proof.blockchainTxSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction on Solana Explorer
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
