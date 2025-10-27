import { AlertTriangle, Shield, AlertCircle, Info } from "lucide-react";

interface RiskGaugeProps {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const getColor = () => {
    if (score <= 30) return "text-green-600 dark:text-green-400";
    if (score <= 70) return "text-yellow-600 dark:text-yellow-400";
    if (score <= 90) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = () => {
    if (score <= 30) return "bg-green-500";
    if (score <= 70) return "bg-yellow-500";
    if (score <= 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const getIcon = () => {
    if (score <= 30) return <Shield className="w-5 h-5" />;
    if (score <= 70) return <Info className="w-5 h-5" />;
    if (score <= 90) return <AlertCircle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getLevelText = () => {
    switch (level) {
      case "LOW":
        return "Low Risk - Direct execution recommended";
      case "MEDIUM":
        return "Medium Risk - Protection available";
      case "HIGH":
        return "High Risk - Protected route recommended";
      case "CRITICAL":
        return "Critical Risk - MEV attack likely";
    }
  };

  return (
    <div className="space-y-4" data-testid="risk-gauge">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${getColor()}`}>
            {getIcon()}
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Risk Score</div>
            <div className={`text-2xl font-mono font-semibold ${getColor()}`} data-testid="text-risk-score">
              {score}/100
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColor()} bg-current/10`} data-testid="badge-risk-level">
          {level}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${getBgColor()} transition-all duration-500 ease-out`}
            style={{ width: `${score}%` }}
            data-testid="progress-risk-bar"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Description */}
      <div className="text-sm text-muted-foreground" data-testid="text-risk-description">
        {getLevelText()}
      </div>
    </div>
  );
}
