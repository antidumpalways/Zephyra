import { Link } from "wouter";
import { Shield, Code2, Zap, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Docs() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const copyCode = async (code: string, section: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(section);
      toast({
        title: "Copied to clipboard",
        description: "Code snippet copied successfully",
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const installCode = `npm install @zephyra/sdk`;
  
  const basicUsageCode = `import { Zephyra } from '@zephyra/sdk';

// Initialize Zephyra
const zephyra = new Zephyra({
  network: 'devnet' // or 'mainnet-beta'
});

// Protect a swap
const result = await zephyra.protectSwap({
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: 10,
  userAddress: wallet.publicKey.toString()
});

console.log(\`Saved: $\${result.actualSavings}\`);
console.log(\`Risk Score: \${result.riskScore}/100\`);`;

  const advancedCode = `// Custom safety logic
const customProtection = zephyra.createSafetyRule({
  name: 'low-latency-only',
  condition: (simulation) => simulation.latency < 100,
  action: 'reject',
  message: 'Transaction exceeds latency threshold'
});

// Apply rule
const result = await zephyra.protectSwap({
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: 10,
  userAddress: wallet.publicKey.toString()
}, {
  safetyRules: [customProtection]
});`;

  const apiReferenceCode = `interface ZephyraSDK {
  // Simulate and protect a swap
  protectSwap(params: SwapParams, options?: Options): Promise<Result>;
  
  // Get risk analysis only
  analyzeRisk(params: SwapParams): Promise<RiskAnalysis>;
  
  // Create custom safety rules
  createSafetyRule(rule: SafetyRule): SafetyRule;
  
  // Get transaction proof
  getProof(transactionId: string): Promise<ProofOfRoute>;
}

interface SwapParams {
  inputToken: string;
  outputToken: string;
  amount: number;
  userAddress: string;
}

interface Result {
  transactionId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  outputAmount: string;
  actualSavings: string;
  potentialSavings: string;
  proofHash: string;
  executionTime: number;
}`;

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
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-dashboard">
                Dashboard
              </span>
            </Link>
            <Link href="/swap">
              <Button data-testid="button-try-demo">Try Demo</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Developer Documentation</span>
            </div>
            <h1 className="text-4xl font-semibold mb-4">Zephyra SDK</h1>
            <p className="text-lg text-muted-foreground">
              Build MEV protection into your Solana dApp with just a few lines of code.
              Our SDK handles simulation, routing, and execution while you focus on building.
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            
            <Card className="mb-6">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Installation</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(installCode, 'install')}
                  >
                    {copiedSection === 'install' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 rounded bg-muted font-mono text-sm overflow-x-auto">
                  <code>{installCode}</code>
                </pre>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Basic Usage</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(basicUsageCode, 'basic')}
                  >
                    {copiedSection === 'basic' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 rounded bg-muted font-mono text-sm overflow-x-auto">
                  <code>{basicUsageCode}</code>
                </pre>
              </div>
            </Card>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI Risk Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time risk analysis (0-100) for every transaction with explainable AI reasoning.
                </p>
              </Card>

              <Card className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Sub-100ms Latency</h3>
                <p className="text-sm text-muted-foreground">
                  Lightning-fast simulation and execution powered by Ephemeral Rollups.
                </p>
              </Card>

              <Card className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Custom Safety Logic</h3>
                <p className="text-sm text-muted-foreground">
                  Define your own rules: latency thresholds, risk limits, auto-warnings, and more.
                </p>
              </Card>

              <Card className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Proof-of-Route</h3>
                <p className="text-sm text-muted-foreground">
                  Every transaction includes verifiable proof with complete audit trail.
                </p>
              </Card>
            </div>
          </section>

          {/* Advanced Usage */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Advanced Usage</h2>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Custom Safety Rules</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(advancedCode, 'advanced')}
                >
                  {copiedSection === 'advanced' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="p-4 rounded bg-muted font-mono text-sm overflow-x-auto">
                <code>{advancedCode}</code>
              </pre>
              <p className="text-sm text-muted-foreground mt-4">
                Create custom protection rules tailored to your application's needs. Examples:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Only allow swaps with latency under 100ms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Auto-warn users if risk score exceeds 70</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reject transactions that detect wallet drain patterns</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* API Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
            
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">TypeScript Interfaces</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(apiReferenceCode, 'api')}
                >
                  {copiedSection === 'api' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="p-4 rounded bg-muted font-mono text-sm overflow-x-auto">
                <code>{apiReferenceCode}</code>
              </pre>
            </Card>
          </section>

          {/* Support */}
          <section>
            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                Join our community or reach out for integration support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" data-testid="button-join-discord">
                  Join Discord
                </Button>
                <Button size="lg" variant="outline" data-testid="button-view-examples">
                  View Examples on GitHub
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
