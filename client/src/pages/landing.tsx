import { Link } from "wouter";
import { Shield, Zap, Eye, Code2, TrendingUp, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-sans font-semibold text-xl tracking-tight">Zephyra</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-dashboard">
                Dashboard
              </span>
            </Link>
            <Link href="/sdk">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-developer-api">
                Developer API
              </span>
            </Link>
            <Link href="/dashboard">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headlines + CTAs */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Sub-100ms Protection</span>
              </div>
              
              <h1 className="font-sans font-semibold text-5xl lg:text-6xl leading-tight tracking-tight">
                Stop MEV Attacks<br />
                <span className="text-primary">Before They Happen</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md">
                AI-powered real-time protection for your DeFi swaps. Save money on every transaction 
                with transparent, verifiable route optimization powered by Ephemeral Rollups.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-launch-app">
                    Launch App <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-view-docs">
                    <Code2 className="w-4 h-4 mr-2" /> Developer API
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-2xl font-semibold font-mono">$400M+</div>
                  <div className="text-sm text-muted-foreground">Lost to MEV in 2025</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold font-mono">&lt;100ms</div>
                  <div className="text-sm text-muted-foreground">Protection Speed</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold font-mono">10-15%</div>
                  <div className="text-sm text-muted-foreground">Avg. Savings</div>
                </div>
              </div>
            </div>

            {/* Right: Comparison Widget */}
            <div className="space-y-4">
              <Card className="p-6 border-destructive/50 bg-destructive/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Without Zephyra</div>
                    <div className="text-2xl font-mono font-semibold mt-2">10 SOL → 1,823 USDC</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-xl">❌</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Direct route</span>
                    <span className="text-destructive font-medium">Sandwich detected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lost to MEV</span>
                    <span className="text-destructive font-semibold font-mono">$230 USD</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-primary/50 bg-primary/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">With Zephyra</div>
                    <div className="text-2xl font-mono font-semibold mt-2 text-primary">10 SOL → 1,847 USDC</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Protected route</span>
                    <span className="text-primary font-medium">Private ER</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount saved</span>
                    <span className="text-primary font-semibold font-mono">$223 USD ✓</span>
                  </div>
                </div>
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                <Lock className="w-4 h-4 inline mr-1" />
                Protected by MagicBlock Ephemeral Rollups
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">How Zephyra Protects You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three layers of protection working together in real-time to maximize your savings
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Risk Detection</h3>
              <p className="text-muted-foreground mb-4">
                Real-time analysis of pool liquidity, MEV bot activity, and transaction patterns to 
                calculate risk scores (0-100) in &lt;50ms.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Sandwich attack detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Front-running prevention</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Pool volatility monitoring</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Private Simulation</h3>
              <p className="text-muted-foreground mb-4">
                Execute swaps in Private Ephemeral Rollups before hitting mainnet. Hide your intent 
                from MEV bots and get guaranteed pricing.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Multi-DEX route comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Zero-fee simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Optimal path selection</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover-elevate">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proof of Route</h3>
              <p className="text-muted-foreground mb-4">
                Every transaction includes a verifiable proof showing exactly how we protected you. 
                Full transparency with cryptographic verification.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Audit trail with timestamps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Route selection reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Blockchain verification</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Developer API Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Developer API</span>
              </div>
              <h2 className="text-4xl font-semibold mb-6">
                Build MEV Protection<br />Into Your dApp
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Integrate Zephyra's protection layer with just a few lines of code. 
                Our SDK handles simulation, routing, and execution while you focus on building.
              </p>
              <Link href="/docs">
                <Button size="lg" data-testid="button-explore-api">
                  Explore API <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <Card className="p-6 bg-card-foreground/5">
              <pre className="text-sm font-mono overflow-x-auto">
                <code className="text-foreground">{`import { Zephyra } from '@zephyra/sdk';

const zephyra = new Zephyra();

// Simulate and protect a swap
const result = await zephyra.protectSwap({
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: 10,
  userAddress: wallet.publicKey
});

console.log(\`Saved: $\${result.savings}\`);
// => Saved: $223`}</code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-6">
            Start Protecting Your Transactions
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders saving an average of 10-15% on every swap with Zephyra's AI-powered MEV protection.
          </p>
          <Link href="/dashboard">
            <Button size="lg" data-testid="button-launch-zephyra">
              Launch Zephyra <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Zephyra</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built for Cypherpunk Hackathon 2025 • Powered by MagicBlock
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
