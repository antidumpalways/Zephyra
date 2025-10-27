import { CheckCircle2, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RouteOption {
  dex: string;
  estimatedOutput: string;
  priceImpact: string;
  slippage: string;
  mevRisk: number;
  latency: number;
  selected: boolean;
}

interface RouteComparisonProps {
  selectedRoute: string;
  alternativeRoutes: RouteOption[];
  outputAmount: string;
  potentialSavings: string;
}

export function RouteComparison({
  selectedRoute,
  alternativeRoutes,
  outputAmount,
  potentialSavings,
}: RouteComparisonProps) {
  const routes = alternativeRoutes || [];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Route Analysis</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Compared {routes.length} routes across Jupiter, Raydium, and Orca DEXs
      </p>

      <div className="space-y-4">
        {routes.map((route, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              route.selected
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card"
            }`}
            data-testid={`card-route-${route.dex.toLowerCase()}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {route.selected && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {route.dex}
                    {route.selected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated Output: {route.estimatedOutput} USDC
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">MEV Risk</div>
                <div className={`text-lg font-mono font-semibold ${
                  route.mevRisk > 70 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {route.mevRisk}/100
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Price Impact</div>
                <div className="font-mono">{route.priceImpact}%</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Slippage</div>
                <div className="font-mono">{route.slippage}%</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Latency</div>
                <div className="font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {route.latency}ms
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Best Route Selected: {selectedRoute}</div>
              <div className="text-sm text-muted-foreground">
                Protected via Private Ephemeral Rollup
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">You'll Save</div>
            <div className="text-2xl font-mono font-semibold text-primary">
              ${potentialSavings}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
