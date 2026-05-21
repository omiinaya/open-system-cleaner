# Component Specifications

## Core UI Components

### 1. HealthScoreGauge Component

#### Purpose

Circular gauge that displays system health score (0-100) with animated transitions and color-coded segments.

#### Design Specifications

```typescript
interface HealthScoreGaugeProps {
  score: number; // Health score from 0-100
  size?: "sm" | "md" | "lg" | "xl"; // Default: 'md'
  showLabel?: boolean; // Show percentage in center
  animate?: boolean; // Enable smooth animations
  strokeWidth?: number; // Gauge stroke width
  className?: string; // Additional CSS classes
}

// Size mappings:
const sizes = {
  sm: { diameter: 120, stroke: 8 },
  md: { diameter: 160, stroke: 10 },
  lg: { diameter: 200, stroke: 12 },
  xl: { diameter: 240, stroke: 14 },
};

// Color thresholds:
const thresholds = {
  danger: { max: 40, color: "#ef4444" },
  warning: { max: 70, color: "#f59e0b" },
  success: { max: 100, color: "#22c55e" },
};
```

#### Visual Design

- **Circular Progress**: SVG-based circular gauge
- **Color Coding**: Red (0-40), Yellow (41-70), Green (71-100)
- **Animation**: Smooth transition when score changes
- **Label**: Large percentage text in center
- **Background**: Subtle ring showing maximum value

#### Implementation Details

```tsx
const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  size = "md",
  showLabel = true,
  animate = true,
  strokeWidth,
  className,
}) => {
  const { diameter, stroke } = sizes[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg width={diameter} height={diameter}>
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke={getColorForScore(score)}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={animate ? "transition-all duration-500" : ""}
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {score}%
          </span>
        </div>
      )}
    </div>
  );
};
```

### 2. SystemCard Component

#### Purpose

Reusable card component for feature modules with consistent styling and interaction patterns.

#### Design Specifications

```typescript
interface SystemCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: "idle" | "scanning" | "success" | "warning" | "error";
  progress?: number; // 0-100
  actions?: CardAction[];
  variant?: "default" | "info" | "warning" | "success" | "danger";
  onClick?: () => void;
  className?: string;
}

interface CardAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}
```

#### Visual Design

- **Card Layout**: Consistent padding, border radius, shadow
- **Status Indicators**: Color-coded borders and icons
- **Progress Bar**: Linear progress indicator
- **Action Buttons**: Primary and secondary actions
- **Hover Effects**: Subtle elevation and color changes

#### Implementation Details

```tsx
const SystemCard: React.FC<SystemCardProps> = ({
  title,
  description,
  icon,
  status = "idle",
  progress,
  actions = [],
  variant = "default",
  onClick,
  className,
}) => {
  const cardClasses = cn(
    "bg-white dark:bg-gray-800 rounded-lg border p-6 transition-all",
    "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600",
    {
      "border-gray-200 dark:border-gray-700": variant === "default",
      "border-blue-200 dark:border-blue-700": variant === "info",
      "border-yellow-200 dark:border-yellow-700": variant === "warning",
      "border-green-200 dark:border-green-700": variant === "success",
      "border-red-200 dark:border-red-700": variant === "danger",
      "cursor-pointer": onClick,
    },
    className,
  );

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && <div className="text-2xl">{icon}</div>}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>

      {progress !== undefined && (
        <ProgressBar value={progress} className="mb-4" />
      )}

      {actions.length > 0 && (
        <div className="flex space-x-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "secondary"}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              size="sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. ProgressIndicator Component

#### Purpose

Flexible progress indicator with multiple variants and configurations.

#### Design Specifications

```typescript
interface ProgressIndicatorProps {
  value: number; // 0-100
  max?: number; // Default: 100
  variant?: "linear" | "circular" | "stepped";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  color?: "primary" | "success" | "warning" | "danger";
  className?: string;
}
```

#### Visual Design

- **Linear**: Horizontal progress bar
- **Circular**: Circular progress indicator
- **Stepped**: Multi-step progress with milestones
- **Color Variants**: Theme-consistent colors
- **Labels**: Percentage or custom text

### 4. PerformanceChart Component

#### Purpose

Real-time performance monitoring charts for system metrics.

#### Design Specifications

```typescript
interface PerformanceChartProps {
  type: "cpu" | "memory" | "disk" | "network";
  data: PerformanceDataPoint[];
  timeRange: "1m" | "5m" | "15m" | "1h" | "24h";
  refreshInterval?: number; // ms
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

interface PerformanceDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}
```

## Layout Components

### 1. AppLayout Component

#### Purpose

Main application layout with sidebar navigation and content area.

#### Design Specifications

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}
```

#### Visual Design

- **Sidebar**: Fixed left navigation with icons
- **Header**: Top bar with system status and controls
- **Main Content**: Scrollable content area
- **Responsive**: Collapsible sidebar for smaller screens

### 2. SidebarNavigation Component

#### Purpose

Navigation sidebar with module links and system status.

#### Design Specifications

```typescript
interface SidebarNavigationProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavigationItem {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}
```

## Module-Specific Components

### 1. Dashboard Components

#### SystemHealthPanel

- **Purpose**: Display overall system health with gauge and metrics
- **Features**: Real-time updates, trend indicators, quick actions

#### PerformanceGrid

- **Purpose**: Grid of real-time performance charts
- **Features**: CPU, Memory, Disk, Network monitoring

#### QuickActionsPanel

- **Purpose**: One-click optimization actions
- **Features**: Scan, Optimize, Protect quick buttons

### 2. Clean Module Components

#### ScanProgressPanel

- **Purpose**: Show scan progress and results
- **Features**: File categories, sizes, clean options

#### JunkFilesCard

- **Purpose**: Junk file detection and cleanup
- **Features**: File type breakdown, size estimation

#### RegistryCleanerCard

- **Purpose**: Registry issue detection and fixing
- **Features**: Issue categories, backup options

### 3. Optimize Module Components

#### StartupManager

- **Purpose**: Manage startup programs
- **Features**: Program list, impact assessment, toggle controls

#### RAMOptimizer

- **Purpose**: Memory optimization controls
- **Features**: Usage monitoring, optimization presets

#### InternetBooster

- **Purpose**: Network optimization
- **Features**: Speed test, optimization settings

### 4. Protect Module Components

#### SecurityStatusPanel

- **Purpose**: Overall security status
- **Features**: Issue level, hardening status

#### VulnerabilityScanner

- **Purpose**: Vulnerability detection and assessment
- **Features**: Scan types, remediation management

#### RealTimeProtection

- **Purpose**: Real-time security monitoring
- **Features**: Protection toggles, activity logs

### 5. Speed Up Module Components

#### GameBooster

- **Purpose**: Gaming performance optimization
- **Features**: Game profiles, resource allocation

#### ProcessManager

- **Purpose**: System process management
- **Features**: Process list, resource usage, optimization

#### PerformanceMonitor

- **Purpose**: Detailed performance tracking
- **Features**: Historical data, alerts, recommendations

### 6. Toolbox Module Components

#### SoftwareUninstaller

- **Purpose**: Program removal utility
- **Features**: Program list, leftover detection

#### DriverUpdater

- **Purpose**: Driver update management
- **Features**: Outdated drivers, update options

#### FileTools

- **Purpose**: File management utilities
- **Features**: Split, join, encrypt functions

## Utility Components

### 1. Button Component

#### Purpose

Consistent button styling with multiple variants.

#### Design Specifications

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

### 2. Modal Component

#### Purpose

Flexible modal dialog system.

#### Design Specifications

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}
```

### 3. Toast Component

#### Purpose

Notification system for user feedback.

#### Design Specifications

```typescript
interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}
```

## Component Development Guidelines

### 1. TypeScript Best Practices

- Use strict type checking
- Define clear interfaces for props
- Use generic types where appropriate
- Implement proper error boundaries

### 2. Styling Guidelines

- Use Tailwind CSS utility classes
- Maintain consistent spacing and typography
- Implement dark mode support
- Ensure accessibility compliance

### 3. Performance Optimization

- Implement React.memo for expensive components
- Use useCallback and useMemo appropriately
- Lazy load heavy components
- Optimize re-renders with proper dependency arrays

### 4. Testing Strategy

- Write unit tests for business logic
- Use React Testing Library for component tests
- Implement integration tests for critical workflows
- Test accessibility with screen readers

This comprehensive component specification provides the foundation for building a consistent, maintainable, and high-performance UI for the Advanced SystemCare alternative.
