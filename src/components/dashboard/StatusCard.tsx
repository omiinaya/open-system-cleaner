import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';

export interface StatusCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  variant = 'default',
  sparklineData,
  onClick,
  className,
}) => {
  const variantClasses = {
    default: 'text-text-secondary',
    primary: 'text-primary-500 bg-primary-500/10',
    success: 'text-success-500 bg-success-500/10',
    warning: 'text-warning-500 bg-warning-500/10',
    danger: 'text-danger-500 bg-danger-500/10',
  };
  
  const trendColors = {
    up: 'text-success-500',
    down: 'text-danger-500',
    neutral: 'text-text-tertiary',
  };
  
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };
  
  // Generate mini sparkline SVG path
  const generateSparkline = (data: number[]) => {
    if (data.length < 2) return '';
    
    const width = 60;
    const height = 24;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bg-secondary border border-border rounded-lg p-4',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-border-hover hover:shadow-theme',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2.5 rounded-lg',
              variant === 'default' ? 'bg-bg-tertiary' : variantClasses[variant]
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                variant === 'default' ? 'text-text-secondary' : ''
              )}
            />
          </div>
          
          <div>
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-lg font-semibold text-text-primary">{value}</p>
            {subValue && (
              <p className="text-xs text-text-tertiary">{subValue}</p>
            )}
          </div>
        </div>
        
        {sparklineData && (
          <div className="flex-shrink-0">
            <svg
              width="60"
              height="24"
              viewBox="0 0 60 24"
              className="overflow-visible"
            >
              <path
                d={generateSparkline(sparklineData)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={cn(
                  'text-primary-500',
                  variant !== 'default' && variantClasses[variant].split(' ')[0]
                )}
              />
            </svg>
          </div>
        )}
      </div>
      
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn('text-sm font-medium', trendColors[trend])}>
            {trendIcons[trend]} {trendValue}
          </span>
          <span className="text-xs text-text-tertiary">vs last hour</span>
        </div>
      )}
    </div>
  );
};

export default StatusCard;
