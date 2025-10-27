import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Transaction } from "@shared/schema";

interface SavingsChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function SavingsChart({ transactions, isLoading }: SavingsChartProps) {
  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded" />;
  }

  // Process data for cumulative savings
  const chartData = transactions
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .reduce((acc, tx, index) => {
      const prevSavings = index > 0 ? acc[index - 1].savings : 0;
      const currentSavings = parseFloat(tx.actualSavings) || 0;
      
      acc.push({
        date: new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        savings: prevSavings + currentSavings,
      });
      
      return acc;
    }, [] as { date: string; savings: number }[]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground" data-testid="empty-state-chart">
        <div className="text-center">
          <p>No data to display yet</p>
          <p className="text-sm mt-1">Your savings will appear here after your first transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64" data-testid="chart-savings">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.375rem",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--primary))" }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Cumulative Savings"]}
          />
          <Line
            type="monotone"
            dataKey="savings"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#savingsGradient)"
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
