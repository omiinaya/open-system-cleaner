import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export interface HealthScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  size = "md",
  showLabel = true,
  animated = true,
  className,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Determine color based on score
  const getColor = (value: number): string => {
    if (value <= 40) return "text-danger-500";
    if (value <= 70) return "text-warning-500";
    return "text-success-500";
  };

  const getStrokeColor = (value: number): string => {
    if (value <= 40) return "stroke-danger-500";
    if (value <= 70) return "stroke-warning-500";
    return "stroke-success-500";
  };

  const getStatusText = (value: number): string => {
    if (value <= 40) return "Critical";
    if (value <= 70) return "Fair";
    return "Excellent";
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      width: 80,
      height: 80,
      strokeWidth: 6,
      radius: 34,
      fontSize: "text-xl",
      labelSize: "text-[10px]",
      statusSize: "text-xs",
    },
    md: {
      width: 128,
      height: 128,
      strokeWidth: 10,
      radius: 54,
      fontSize: "text-3xl",
      labelSize: "text-xs",
      statusSize: "text-sm",
    },
    lg: {
      width: 180,
      height: 180,
      strokeWidth: 14,
      radius: 78,
      fontSize: "text-5xl",
      labelSize: "text-sm",
      statusSize: "text-base",
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset =
    circumference - (animatedScore / 100) * circumference;

  // Animate score on mount or when score changes
  useEffect(() => {
    if (!animated) {
      setAnimatedScore(score);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animated]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: config.width, height: config.height }}
      >
        <svg
          width={config.width}
          height={config.height}
          className="transform -rotate-90"
          viewBox={`0 0 ${config.width} ${config.height}`}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-bg-tertiary"
          />

          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-500 ease-out",
              getStrokeColor(animatedScore),
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-text-primary", config.fontSize)}>
            {animatedScore}
          </span>
          {showLabel && (
            <span className={cn("text-text-secondary", config.labelSize)}>
              Score
            </span>
          )}
        </div>
      </div>

      {/* Status text */}
      {showLabel && (
        <div
          className={cn(
            "mt-2 font-medium",
            getColor(animatedScore),
            config.statusSize,
          )}
        >
          {getStatusText(animatedScore)}
        </div>
      )}
    </div>
  );
};

export default HealthScoreGauge;
