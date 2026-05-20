import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "../../utils/cn";

export interface PerformanceDataPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
}

export interface PerformanceChartProps {
  data?: PerformanceDataPoint[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  className?: string;
}

// Generate initial data
const generateInitialData = (): PerformanceDataPoint[] => {
  const data: PerformanceDataPoint[] = [];
  const now = new Date();

  for (let i = 59; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 1000);
    data.push({
      time: time.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      cpu: Math.floor(Math.random() * 40) + 20,
      memory: Math.floor(Math.random() * 30) + 40,
      disk: Math.floor(Math.random() * 20) + 5,
    });
  }

  return data;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data: initialData,
  height = 300,
  showLegend = true,
  showGrid = true,
  animated = true,
  className,
}) => {
  const [data, setData] = useState<PerformanceDataPoint[]>(
    initialData || generateInitialData(),
  );

  // Real-time data simulation
  useEffect(() => {
    if (!initialData) {
      const interval = setInterval(() => {
        setData((prevData) => {
          const now = new Date();
          const newPoint: PerformanceDataPoint = {
            time: now.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            cpu: Math.floor(Math.random() * 40) + 20,
            memory: Math.floor(Math.random() * 30) + 40,
            disk: Math.floor(Math.random() * 20) + 5,
          };

          const newData = [...prevData.slice(1), newPoint];
          return newData;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [initialData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border rounded-lg p-3 shadow-lg">
          <p className="text-text-secondary text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-primary capitalize">
                {entry.name}:
              </span>
              <span className="font-medium text-text-primary">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Gradient definitions
  const gradients = useMemo(
    () => (
      <defs>
        <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>
    ),
    [],
  );

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {gradients}

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="time"
            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval="preserveStartEnd"
            minTickGap={30}
          />

          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingBottom: "10px" }}
            />
          )}

          <Area
            type="monotone"
            dataKey="cpu"
            name="CPU"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#cpuGradient)"
            isAnimationActive={animated}
            animationDuration={500}
          />

          <Area
            type="monotone"
            dataKey="memory"
            name="Memory"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#memoryGradient)"
            isAnimationActive={animated}
            animationDuration={500}
          />

          <Area
            type="monotone"
            dataKey="disk"
            name="Disk"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#diskGradient)"
            isAnimationActive={animated}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
