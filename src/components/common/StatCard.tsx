import React from "react";
import { cn } from "../../utils/cn";
import { ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";

export interface StatCardProps {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  trendLabel?: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  trend,
  trendValue,
  trendLabel,
  icon: Icon,
  iconColor = "primary",
  size = "md",
  className,
}) => {
  const colorClasses = {
    primary: "text-primary-500 bg-primary-500/10",
    success: "text-success-500 bg-success-500/10",
    warning: "text-warning-500 bg-warning-500/10",
    danger: "text-danger-500 bg-danger-500/10",
    info: "text-blue-500 bg-blue-500/10",
  };

  const trendConfig = {
    up: {
      icon: ArrowUp,
      color: "text-success-500",
      bgColor: "bg-success-500/10",
    },
    down: {
      icon: ArrowDown,
      color: "text-danger-500",
      bgColor: "bg-danger-500/10",
    },
    neutral: {
      icon: Minus,
      color: "text-text-tertiary",
      bgColor: "bg-bg-tertiary",
    },
  };

  const sizeConfig = {
    sm: {
      padding: "p-3",
      valueSize: "text-xl",
      labelSize: "text-xs",
      iconSize: "w-8 h-8",
      iconInner: "w-4 h-4",
    },
    md: {
      padding: "p-4",
      valueSize: "text-2xl",
      labelSize: "text-sm",
      iconSize: "w-10 h-10",
      iconInner: "w-5 h-5",
    },
    lg: {
      padding: "p-5",
      valueSize: "text-3xl",
      labelSize: "text-sm",
      iconSize: "w-12 h-12",
      iconInner: "w-6 h-6",
    },
  };

  const sizeClass = sizeConfig[size];
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border rounded-lg",
        "transition-all duration-200 hover:border-border-hover",
        sizeClass.padding,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("font-bold text-text-primary", sizeClass.valueSize)}>
            {value}
          </p>
          <p className={cn("text-text-secondary mt-0.5", sizeClass.labelSize)}>
            {label}
          </p>

          {trend && TrendIcon && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                  trendConfig[trend].bgColor,
                  trendConfig[trend].color,
                )}
              >
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
              {trendLabel && (
                <span className="text-xs text-text-tertiary">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg flex-shrink-0",
              sizeClass.iconSize,
              colorClasses[iconColor],
            )}
          >
            <Icon className={sizeClass.iconInner} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
