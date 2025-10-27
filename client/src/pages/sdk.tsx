import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Code, Play, Copy, Key, Shield, Zap, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const MOCK_WALLET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export default function SDKPage() {
  const [apiKey, setApiKey] = useState("");
  const [keyName, setKeyName] = useState("");
  const [testEndpoint, setTestEndpoint] = useState<"simulate" | "execute" | "risk">("simulate");
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    inputToken: "SOL",
    outputToken: "USDC",
    inputAmount: "1.0"
  }, null, 2));
  const [apiResponse, setApiResponse] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch API keys
  const { data: apiKeys, isLoading: keysLoading } = useQuery<any[]>({
    queryKey: [`/api/keys/${MOCK_WALLET}`],
  });

  // Generate new API key
  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: MOCK_WALLET,
          name: keyName || "My API Key"
        }),
      });
      
      const data = await response.json();
      
      // Check for errors
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to generate API key");
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      setApiKey(data.key);
      toast({
        title: "API Key Generated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/keys/${MOCK_WALLET}`] });
      setKeyName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test SDK endpoint
  const testApiMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) throw new Error("API key required");
      
      const endpoints: Record<string, { method: string; url: string }> = {
        simulate: { method: "POST", url: "/api/sdk/simulate" },
        execute: { method: "POST", url: "/api/sdk/execute" },
        risk: { method: "GET", url: "/api/sdk/risk-analysis/test-id" },
      };

      const endpoint = endpoints[testEndpoint];
      const headers: Record<string, string> = {
        "X-API-Key": apiKey,
      };

      if (endpoint.method === "POST") {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers,
        body: endpoint.method === "POST" ? testPayload : undefined,
      });

      const data = await response.json();
      return { status: response.status, data };
    },
    onSuccess: (result) => {
      setApiResponse(JSON.stringify(result.data, null, 2));
      toast({
        title: `API Test: ${result.status}`,
        description: result.status === 200 ? "Success!" : "Error occurred",
        variant: result.status === 200 ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      setApiResponse(JSON.stringify({ error: error.message }, null, 2));
      toast({
        title: "API Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyCode = (code: string, section: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const jsExample = `import fetch from 'node-fetch';

const ZEPHYRA_API_KEY = '${apiKey || 'zeph_your_api_key_here'}';

// Simulate MEV-protected swap
async function simulateSwap() {
  const response = await fetch('https://api.zephyra.app/api/sdk/simulate', {
    method: 'POST',
    headers: {
      'X-API-Key': ZEPHYRA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputToken: 'SOL',
      outputToken: 'USDC',
      inputAmount: '1.0'
    })
  });
  
  const result = await response.json();
  console.log('Risk Score:', result.riskScore);
  console.log('Selected Route:', result.selectedRoute);
  console.log('Potential Savings:', result.potentialSavings);
  return result;
}

simulateSwap();`;

  const curlExample = `curl -X POST https://api.zephyra.app/api/sdk/simulate \\
  -H "X-API-Key: ${apiKey || 'zeph_your_api_key_here'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputToken": "SOL",
    "outputToken": "USDC",
    "inputAmount": "1.0"
  }'`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Zephyra SDK</h1>
          <p className="text-lg text-muted-foreground">
            Integrate MEV protection into your DeFi applications with our developer API
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <Shield className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">MEV Protection</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered risk analysis protects every swap from sandwich attacks and front-running
            </p>
          </Card>
          <Card className="p-6">
            <Zap className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Multi-DEX Routing</h3>
            <p className="text-sm text-muted-foreground">
              Automatically compare Jupiter, Raydium, and Orca to find the best protected route
            </p>
          </Card>
          <Card className="p-6">
            <Code className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Simple Integration</h3>
            <p className="text-sm text-muted-foreground">
              RESTful API with 3 endpoints - simulate, execute, and analyze. Start in minutes.
            </p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: API Keys & Playground */}
          <div className="space-y-6">
            {/* API Key Management */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Key className="w-6 h-6" />
                API Keys
              </h2>
              
              {/* Generate Key */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Generate New API Key</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (e.g., Production App)"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    data-testid="input-key-name"
                  />
                  <Button
                    onClick={() => generateKeyMutation.mutate()}
                    disabled={generateKeyMutation.isPending}
                    data-testid="button-generate-key"
                  >
                    {generateKeyMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>

              {/* Show generated key */}
              {apiKey && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-sm font-medium mb-2 text-primary">
                    ⚠️ Save this key - it won't be shown again!
                  </div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 p-2 bg-background rounded text-xs font-mono break-all">
                      {apiKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(apiKey, "key")}
                      data-testid="button-copy-key"
                    >
                      {copiedSection === "key" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* List existing keys */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your API Keys</label>
                {keysLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-2">
                    {apiKeys.map((key: any) => (
                      <div
                        key={key.id}
                        className="p-3 border border-border rounded-lg flex items-center justify-between"
                        data-testid={`key-item-${key.id}`}
                      >
                        <div>
                          <div className="font-medium text-sm">{key.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {key.requestsToday} requests today • {key.requestsPerMinute}/min limit
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${key.active ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-600'}`}>
                          {key.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No API keys yet. Generate one to get started.
                  </div>
                )}
              </div>
            </Card>

            {/* API Playground */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Play className="w-6 h-6" />
                API Playground
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Endpoint</label>
                  <div className="flex gap-2">
                    <Button
                      variant={testEndpoint === "simulate" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestEndpoint("simulate")}
                      data-testid="button-endpoint-simulate"
                    >
                      Simulate
                    </Button>
                    <Button
                      variant={testEndpoint === "execute" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestEndpoint("execute")}
                      data-testid="button-endpoint-execute"
                    >
                      Execute
                    </Button>
                    <Button
                      variant={testEndpoint === "risk" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTestEndpoint("risk")}
                      data-testid="button-endpoint-risk"
                    >
                      Risk Analysis
                    </Button>
                  </div>
                </div>

                {(testEndpoint === "simulate" || testEndpoint === "execute") && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Request Body (JSON)</label>
                    <Textarea
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="font-mono text-xs"
                      rows={6}
                      data-testid="input-test-payload"
                    />
                  </div>
                )}

                <Button
                  onClick={() => testApiMutation.mutate()}
                  disabled={!apiKey || testApiMutation.isPending}
                  className="w-full"
                  data-testid="button-test-api"
                >
                  {testApiMutation.isPending ? "Testing..." : "Test API"}
                </Button>

                {apiResponse && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Response</label>
                    <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-64 font-mono">
                      {apiResponse}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Documentation */}
          <div className="space-y-6">
            {/* Quick Start */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Generate API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an API key above. Rate limit: 60 requests/minute.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. JavaScript Example</h3>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-96 font-mono">
                      {jsExample}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(jsExample, "js")}
                      data-testid="button-copy-js"
                    >
                      {copiedSection === "js" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. cURL Example</h3>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded text-xs overflow-auto font-mono">
                      {curlExample}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(curlExample, "curl")}
                      data-testid="button-copy-curl"
                    >
                      {copiedSection === "curl" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* API Reference */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
              
              <div className="space-y-6">
                {/* Simulate Endpoint */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-mono rounded">POST</span>
                    <code className="text-sm font-mono">/api/sdk/simulate</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Simulate a MEV-protected swap and get route analysis
                  </p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>Headers:</strong> X-API-Key: your_key</div>
                    <div><strong>Body:</strong> {`{ inputToken, outputToken, inputAmount }`}</div>
                    <div><strong>Response:</strong> Risk score, routes, selected route, potential savings</div>
                  </div>
                </div>

                {/* Execute Endpoint */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-mono rounded">POST</span>
                    <code className="text-sm font-mono">/api/sdk/execute</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Execute the protected swap and get proof hash
                  </p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>Headers:</strong> X-API-Key: your_key</div>
                    <div><strong>Body:</strong> Transaction data from simulate</div>
                    <div><strong>Response:</strong> Transaction ID, proof hash, actual savings</div>
                  </div>
                </div>

                {/* Risk Analysis Endpoint */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm font-mono">/api/sdk/risk-analysis/:id</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get detailed AI risk analysis for a transaction
                  </p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div><strong>Headers:</strong> X-API-Key: your_key</div>
                    <div><strong>Params:</strong> Transaction ID</div>
                    <div><strong>Response:</strong> Full AI risk breakdown with MEV probabilities</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rate Limits */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requests per minute:</span>
                  <span className="font-mono">60</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Burst limit:</span>
                  <span className="font-mono">120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response:</span>
                  <span className="font-mono text-destructive">429 Too Many Requests</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
