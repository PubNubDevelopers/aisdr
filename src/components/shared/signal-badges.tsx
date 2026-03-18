import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  Code,
  TrendingUp,
  Newspaper,
  Smartphone,
  UserCog,
  Zap,
} from "lucide-react";

const signalIcons: Record<string, typeof DollarSign> = {
  FUNDING: DollarSign,
  HIRING: Users,
  TECH_CHANGE: Code,
  INTENT: Zap,
  NEWS: Newspaper,
  APP_GROWTH: Smartphone,
  LEADERSHIP_CHANGE: UserCog,
};

const strengthColors: Record<string, "default" | "success" | "warning" | "secondary"> = {
  high: "success",
  medium: "warning",
  low: "secondary",
};

function getStrengthLabel(strength: number): "high" | "medium" | "low" {
  if (strength >= 0.7) return "high";
  if (strength >= 0.4) return "medium";
  return "low";
}

interface Signal {
  id: string;
  type: string;
  title: string;
  source: string;
  strength: number;
  detectedAt: Date;
  details?: unknown;
}

export function SignalBadges({ signals, max = 3 }: { signals: Signal[]; max?: number }) {
  if (!signals.length) return null;

  const sorted = [...signals].sort((a, b) => b.strength - a.strength);
  const shown = sorted.slice(0, max);
  const remaining = sorted.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((signal) => {
        const Icon = signalIcons[signal.type] || TrendingUp;
        const level = getStrengthLabel(signal.strength);
        return (
          <Badge
            key={signal.id}
            variant={strengthColors[level]}
            className="flex items-center gap-1 text-xs"
            title={signal.title}
          >
            <Icon className="h-3 w-3" />
            {signal.type.replace(/_/g, " ")}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

export function SignalList({ signals }: { signals: Signal[] }) {
  if (!signals.length) {
    return (
      <p className="text-sm text-muted-foreground">No signals detected yet</p>
    );
  }

  const sorted = [...signals].sort((a, b) => b.strength - a.strength);

  return (
    <div className="space-y-2">
      {sorted.map((signal) => {
        const Icon = signalIcons[signal.type] || TrendingUp;
        const level = getStrengthLabel(signal.strength);
        return (
          <div key={signal.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className={`mt-0.5 rounded-lg p-1.5 ${
              level === "high" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : level === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              : "bg-muted text-muted-foreground"
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{signal.title}</p>
                <Badge variant={strengthColors[level]} className="text-xs">
                  {Math.round(signal.strength * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {signal.source} — {new Date(signal.detectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
