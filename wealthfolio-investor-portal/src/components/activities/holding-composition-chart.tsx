import { buildHoldingCompositionSegments, formatPercent } from "@/lib/activities-display";

const CHART_COLORS = [
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6b7280",
];

interface HoldingCompositionChartProps {
  items: Array<{
    key: string;
    label: string;
    weightPct: string;
    positionKind: "security" | "cash";
  }>;
  locale: string;
  emptyMessage: string;
}

export function HoldingCompositionChart({
  items,
  locale,
  emptyMessage,
}: HoldingCompositionChartProps) {
  if (!items.length) {
    return <p className="text-sm text-[var(--wf-muted)]">{emptyMessage}</p>;
  }

  const segments = buildHoldingCompositionSegments(items).map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
      <div className="mx-auto w-full max-w-[220px]">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="var(--wf-border)"
            strokeWidth="4"
          />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              pathLength={100}
              stroke={segment.color}
              strokeWidth="4"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
            />
          ))}
        </svg>
      </div>

      <div className="space-y-2">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex items-center justify-between rounded-xl border border-[var(--wf-border)] bg-[var(--wf-soft)] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-sm font-medium">{segment.label}</span>
            </div>
            <span className="text-sm text-[var(--wf-muted)]">
              {formatPercent(segment.weightPct, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
