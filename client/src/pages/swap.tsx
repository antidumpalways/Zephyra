import { useState } from "react";
import { Link } from "wouter";
import { Shield, ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiskGauge } from "@/components/risk-gauge";
import { RouteComparison } from "@/components/route-comparison";
import { ProofOfRoute } from "@/components/proof-of-route";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Transaction, SwapSimulationRequest } from "@shared/schema";

export default function Swap() {
  const [inputToken, setInputToken] = useState("SOL");
  const [outputToken, setOutputToken] = useState("USDC");
  const [inputAmount, setInputAmount] = useState("");
  const [simulationResult, setSimulationResult] = useState<Transaction | null>(null);
  const walletAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Connect WebSocket for real-time updates
  useWebSocket({ walletAddress });

  // Simulate swap mutation
  const simulateMutation = useMutation({
    mutationFn: async (data: SwapSimulationRequest) => {
      return await apiRequest<Transaction>("POST", "/api/simulate", data);
    },
    onSuccess: (data) => {
      console.log("Simulation result:", data);
      console.log("Transaction ID:", data.id);
      setSimulationResult(data);
      toast({
        title: "Simulation Complete",
        description: `Risk Score: ${data.riskScore}/100 - ${data.riskLevel}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Execute swap mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!simulationResult) throw new Error("No simulation result");
      console.log("Executing with simulation result:", simulationResult);
      console.log("Transaction ID being sent:", simulationResult.id);
      return await apiRequest<Transaction>("POST", "/api/execute", {
        transactionId: simulationResult.id,
        useProtectedRoute: true,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', walletAddress] });
      toast({
        title: "Transaction Protected!",
        description: `Saved $${data.actualSavings} from MEV attacks`,
      });
      // Reset form
      setInputAmount("");
      setSimulationResult(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    simulateMutation.mutate({
      walletAddress,
      inputToken,
      outputToken,
      inputAmount,
    });
  };

  const handleExecute = () => {
    executeMutation.mutate();
  };

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
          <Link href="/dashboard">
            <Button variant="outline" data-testid="button-view-dashboard">
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer" data-testid="link-back-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </span>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-semibold" data-testid="heading-protected-swap">Protected Swap</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" data-testid="button-tooltip-mev-info">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Zephyra analyzes multiple DEX routes and protects you from MEV attacks using AI-powered risk detection</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground">
              Simulate and execute your swap with AI-powered MEV protection
            </p>
          </div>

          {/* Swap Form */}
          <Card className="p-8 mb-6">
            <form onSubmit={handleSimulate}>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="input-token">From</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        id="input-token"
                        value={inputToken}
                        onChange={(e) => setInputToken(e.target.value)}
                        placeholder="SOL"
                        data-testid="input-from-token"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        placeholder="0.00"
                        data-testid="input-from-amount"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="output-token">To</Label>
                    <div className="mt-2">
                      <Input
                        id="output-token"
                        value={outputToken}
                        onChange={(e) => setOutputToken(e.target.value)}
                        placeholder="USDC"
                        data-testid="input-to-token"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={simulateMutation.isPending || !inputAmount}
                  data-testid="button-simulate-swap"
                >
                  {simulateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Simulate Protected Swap
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Simulation Results */}
          {simulationResult && (
            <div className="space-y-6">
              {/* Risk Assessment */}
              <Card className="p-6" data-testid="card-risk-assessment">
                <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
                <RiskGauge
                  score={simulationResult.riskScore}
                  level={simulationResult.riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"}
                />
                
                {simulationResult.mevDetected && (
                  <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <div className="font-medium text-destructive">MEV Risk Detected</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Potential sandwich attack. Zephyra will use a protected route to prevent loss.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Route Comparison */}
              <RouteComparison
                selectedRoute={simulationResult.selectedRoute}
                alternativeRoutes={simulationResult.alternativeRoutes as any}
                outputAmount={simulationResult.outputAmount}
                potentialSavings={simulationResult.potentialSavings}
              />

              {/* Execute Button */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Ready to Execute</h2>
                    <p className="text-sm text-muted-foreground">
                      Your transaction will be protected via Private Ephemeral Rollup
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Estimated Savings</div>
                    <div className="text-2xl font-mono font-semibold text-primary">
                      ${simulationResult.potentialSavings}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-execute-protected"
                >
                  {executeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing Protected Swap...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Execute Protected Swap
                    </>
                  )}
                </Button>
              </Card>

              {/* Proof of Route (after execution) */}
              {simulationResult.status === "completed" && (
                <ProofOfRoute transactionId={simulationResult.id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
