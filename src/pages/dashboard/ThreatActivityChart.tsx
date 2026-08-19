import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { ThreatActivityPoint } from "@/mocks/threatActivity";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER, SEVERITY_HEX } from "@/constants/chartColors";
import { formatDate } from "@/utils/format";

export interface ThreatActivityChartProps {
  data?: ThreatActivityPoint[];
  loading?: boolean;
}

export function ThreatActivityChart({ data, loading }: ThreatActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat activity — last 14 days</CardTitle>
      </CardHeader>

      {loading ? (
        <Skeleton height={260} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="chart-line" title="No activity recorded" description="Once events are ingested, trends will appear here." />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SEVERITY_HEX.critical} stopOpacity={0.4} />
                <stop offset="95%" stopColor={SEVERITY_HEX.critical} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatDate(value).replace(/,.*/, "")}
              stroke={CHART_AXIS_COLOR}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: CHART_TOOLTIP_BG,
                border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                borderRadius: 10,
                fontSize: 12,
              }}
              labelFormatter={(value: string) => formatDate(value)}
            />
            <Area type="monotone" dataKey="critical" stackId="1" stroke={SEVERITY_HEX.critical} fill={SEVERITY_HEX.critical} fillOpacity={0.35} name="Critical" />
            <Area type="monotone" dataKey="high" stackId="1" stroke={SEVERITY_HEX.high} fill={SEVERITY_HEX.high} fillOpacity={0.3} name="High" />
            <Area type="monotone" dataKey="medium" stackId="1" stroke={SEVERITY_HEX.medium} fill={SEVERITY_HEX.medium} fillOpacity={0.25} name="Medium" />
            <Area type="monotone" dataKey="low" stackId="1" stroke={SEVERITY_HEX.low} fill={SEVERITY_HEX.low} fillOpacity={0.2} name="Low" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
