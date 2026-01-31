import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon, Check, AlertCircle } from 'lucide-react';
import Switch from '../ui/Switch';
import Badge from '../ui/Badge';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  status?: 'enabled' | 'disabled' | 'warning' | 'error';
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  actionArea?: React.ReactNode;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  status = 'enabled',
  badge,
  badgeVariant = 'default',
  size = 'md',
  disabled = false,
  actionArea,
  className,
}) => {
  const statusConfig = {
    enabled: {
      iconColor: 'text-success-500 bg-success-500/10',
      indicator: <Check className="w-3.5 h-3.5 text-success-500" />,
    },
    disabled: {
      iconColor: 'text-text-tertiary bg-bg-tertiary',
      indicator: null,
    },
    warning: {
      iconColor: 'text-warning-500 bg-warning-500/10',
      indicator: <AlertCircle className="w-3.5 h-3.5 text-warning-500" />,
    },
    error: {
      iconColor: 'text-danger-500 bg-danger-500/10',
      indicator: <AlertCircle className="w-3.5 h-3.5 text-danger-500" />,
    },
  };
  
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-8 h-8',
      iconInner: 'w-4 h-4',
      titleSize: 'text-sm',
      descSize: 'text-xs',
    },
    md: {
      padding: 'p-4',
      iconSize: 'w-10 h-10',
      iconInner: 'w-5 h-5',
      titleSize: 'text-base',
      descSize: 'text-sm',
    },
    lg: {
      padding: 'p-5',
      iconSize: 'w-12 h-12',
      iconInner: 'w-6 h-6',
      titleSize: 'text-lg',
      descSize: 'text-sm',
    },
  };
  
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];
  
  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border rounded-lg',
        'transition-all duration-200',
        !disabled && 'hover:border-border-hover',
        disabled && 'opacity-60',
        className
      )}
    >
      <div className={cn('flex items-start gap-4', sizeClass.padding)}>
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 rounded-lg flex items-center justify-center',
            sizeClass.iconSize,
            config.iconColor,
            'transition-colors duration-200'
          )}
        >
          <Icon className={sizeClass.iconInner} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={cn('font-semibold text-text-primary', sizeClass.titleSize)}>
                {title}
              </h4>
              
              {badge && (
                <Badge variant={badgeVariant} size="sm">
                  {badge}
                </Badge>
              )}
              
              {config.indicator && !badge && (
                <span className="flex-shrink-0">{config.indicator}</span>
              )}
            </div>
            
            {onCheckedChange !== undefined && (
              <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                size="sm"
              />
            )}
          </div>
          
          <p className={cn('text-text-secondary mt-1', sizeClass.descSize)}>
            {description}
          </p>
          
          {actionArea && (
            <div className="mt-3 pt-3 border-t border-border">
              {actionArea}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
