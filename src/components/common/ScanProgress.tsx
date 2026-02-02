import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';

export interface ScanProgressProps {
  isScanning: boolean;
  progress: number;
  currentAction: string;
  itemsScanned: number;
  totalItems: number;
  issuesFound: number;
  onCancel?: () => void;
  className?: string;
  variant?: 'clean' | 'optimize' | 'protect';
}

const ScanProgress: React.FC<ScanProgressProps> = ({
  isScanning,
  progress,
  currentAction,
  itemsScanned,
  totalItems,
  issuesFound,
  onCancel,
  className,
  variant = 'clean',
}) => {
  const [dots, setDots] = useState('');
  
  // Animated dots for scanning text
  useEffect(() => {
    if (!isScanning) return;
    
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);
    
    return () => clearInterval(interval);
  }, [isScanning]);
  
  const variantConfig = {
    clean: {
      color: 'primary' as const,
      icon: Loader2,
      title: 'Scanning System',
    },
    optimize: {
      color: 'success' as const,
      icon: Loader2,
      title: 'Optimizing System',
    },
    protect: {
      color: 'warning' as const,
      icon: Loader2,
      title: 'Scanning for Vulnerabilities',
    },
  };
  
  const config = variantConfig[variant];
  const Icon = config.icon;
  
  if (!isScanning && progress === 0) {
    return null;
  }
  
  const isComplete = progress >= 100;
  
  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border rounded-xl p-6',
        'transition-all duration-300 animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              `bg-${config.color}-500/10 text-${config.color}-500`
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-success-500" />
            ) : (
              <Icon className={cn('w-5 h-5', isScanning && 'animate-spin')} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              {isComplete ? 'Scan Complete' : config.title}
              {!isComplete && <span className="text-text-secondary">{dots}</span>}
            </h3>
            <p className="text-sm text-text-secondary">{currentAction}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {issuesFound > 0 && (
            <Badge variant={issuesFound > 10 ? 'danger' : 'warning'} dot pulse={!isComplete}>
              {issuesFound} issues found
            </Badge>
          )}
          
          {isScanning && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <Progress
          value={progress}
          max={100}
          color={isComplete ? 'success' : config.color}
          size="lg"
          showLabel
          animated
        />
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-text-secondary">
            Items scanned:{' '}
            <span className="font-medium text-text-primary">
              {itemsScanned.toLocaleString()}
            </span>
            {' / '}
            {totalItems.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {progress > 0 && progress < 100 && (
            <span className="text-text-secondary">
              {Math.round(progress)}% complete
            </span>
          )}
          
          {isComplete && issuesFound === 0 && (
            <span className="flex items-center gap-1.5 text-success-500 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              No issues found
            </span>
          )}
          
          {isComplete && issuesFound > 0 && (
            <span className="flex items-center gap-1.5 text-warning-500 font-medium">
              <AlertCircle className="w-4 h-4" />
              {issuesFound} issues need attention
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanProgress;
