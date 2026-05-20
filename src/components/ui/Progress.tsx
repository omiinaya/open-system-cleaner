import React from "react";
import { cn } from "../../utils/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  animated?: boolean;
  striped?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      color = "primary",
      showLabel = false,
      labelPosition = "outside",
      animated = true,
      striped = false,
      className,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeClasses = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const colorClasses = {
      primary: "bg-primary-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
    };

    const labelText = `${Math.round(percentage)}%`;

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div
          className={cn(
            "w-full bg-bg-tertiary rounded-full overflow-hidden",
            sizeClasses[size],
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              colorClasses[color],
              animated && "transition-all duration-500",
              striped && "progress-striped",
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`Progress: ${labelText}`}
          >
            {showLabel && labelPosition === "inside" && size === "lg" && (
              <span className="flex items-center justify-center h-full text-xs font-medium text-white">
                {labelText}
              </span>
            )}
          </div>
        </div>
        {showLabel && labelPosition === "outside" && (
          <div className="flex justify-between mt-1">
            <span className="text-xs text-text-secondary">Progress</span>
            <span className="text-xs font-medium text-text-primary">
              {labelText}
            </span>
          </div>
        )}
      </div>
    );
  },
);

Progress.displayName = "Progress";

export default Progress;
