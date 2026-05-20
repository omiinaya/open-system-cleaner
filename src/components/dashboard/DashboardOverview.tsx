import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { useNavigationStore } from "../../stores/navigationStore";
import HealthScoreGauge from "./HealthScoreGauge";
import StatusCard from "./StatusCard";
import QuickActionCard from "./QuickActionCard";
import PerformanceChart from "./PerformanceChart";
import Card, { CardHeader, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import {
  Sparkles,
  Zap,
  Shield,
  Gauge,
  Wrench,
  Settings,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Scan,
  MemoryStick,
  ArrowRight,
  Trash2,
} from "lucide-react";

const useAnimatedCounter = (
  target: number,
  duration: number = 1000,
  start: boolean = true,
) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * target);
      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, start]);
  return count;
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}
const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 50,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const childrenArray = React.Children.toArray(children);
  return (
    <div ref={containerRef} className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-500 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{
            transitionDelay: isVisible ? `${index * staggerDelay}ms` : "0ms",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-bg-tertiary rounded", className)} />
);

const DashboardOverview: React.FC = () => {
  const { setCurrentModule } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const animatedCpu = useAnimatedCounter(24, 1500, !isLoading);
  const animatedMemory = useAnimatedCounter(42, 1500, !isLoading);
  const animatedDisk = useAnimatedCounter(156, 1500, !isLoading);
  const animatedNetwork = useAnimatedCounter(85, 1500, !isLoading);

  const getHealthStatusText = (score: number): string => {
    if (score >= 90) return "Your system is in excellent condition";
    if (score >= 70) return "Your system is in good condition";
    if (score >= 50) return "Your system needs attention";
    return "Your system needs immediate care";
  };

  const moduleShortcuts = [
    {
      id: "clean",
      label: "Clean",
      description: "Remove junk",
      icon: Sparkles,
      color: "bg-primary-500/10 text-primary-500",
      module: "clean" as const,
    },
    {
      id: "optimize",
      label: "Optimize",
      description: "Boost performance",
      icon: Zap,
      color: "bg-success-500/10 text-success-500",
      module: "optimize" as const,
    },
    {
      id: "protect",
      label: "Protect",
      description: "Security center",
      icon: Shield,
      color: "bg-warning-500/10 text-warning-500",
      module: "protect" as const,
    },
    {
      id: "speedup",
      label: "Speed Up",
      description: "Gaming mode",
      icon: Gauge,
      color: "bg-danger-500/10 text-danger-500",
      module: "speedup" as const,
    },
    {
      id: "toolbox",
      label: "Toolbox",
      description: "Utilities",
      icon: Wrench,
      color: "bg-blue-500/10 text-blue-500",
      module: "toolbox" as const,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Preferences",
      icon: Settings,
      color: "bg-purple-500/10 text-purple-500",
      module: "settings" as const,
    },
  ];

  const recentActivity = [
    {
      id: "1",
      icon: CheckCircle2,
      color: "success",
      title: "System scan completed",
      time: "2 days ago",
      badge: "Completed",
      badgeVariant: "success" as const,
    },
    {
      id: "2",
      icon: Trash2,
      color: "primary",
      title: "Junk files cleaned",
      time: "1 week ago",
      badge: "1.2 GB",
      badgeVariant: "primary" as const,
    },
    {
      id: "3",
      icon: AlertCircle,
      color: "warning",
      title: "Security scan pending",
      time: "Overdue",
      badge: "Pending",
      badgeVariant: "warning" as const,
    },
    {
      id: "4",
      icon: Zap,
      color: "success",
      title: "RAM optimized",
      time: "2 weeks ago",
      badge: "512 MB",
      badgeVariant: "success" as const,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-success-500/5 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <CardContent className="relative py-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-shrink-0 transition-transform duration-500 hover:scale-105">
              {isLoading ? (
                <SkeletonLoader className="w-[180px] h-[180px] rounded-full" />
              ) : (
                <HealthScoreGauge score={85} size="lg" animated />
              )}
            </div>
            <div className="flex-1 space-y-4">
              {isLoading ? (
                <>
                  <SkeletonLoader className="h-8 w-64" />
                  <SkeletonLoader className="h-4 w-48" />
                  <SkeletonLoader className="h-12 w-32" />
                </>
              ) : (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                      {getHealthStatusText(85)}
                    </h1>
                    <p className="text-text-secondary flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Last scan: 2 days ago
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={<Scan className="w-5 h-5" />}
                      onClick={() => setCurrentModule("clean")}
                      className="shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
                    >
                      Scan Now
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<RotateCcw className="w-5 h-5" />}
                      className="hover:bg-bg-tertiary"
                    >
                      Quick Fix
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="success" size="sm">
                      3 issues found
                    </Badge>
                    <Badge variant="primary" size="sm">
                      2.4 GB cleanable
                    </Badge>
                    <Badge variant="warning" size="sm">
                      1 security alert
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <StaggerContainer
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        staggerDelay={75}
      >
        {isLoading ? (
          Array(4)
            .fill(null)
            .map((_, i) => (
              <SkeletonLoader key={i} className="h-32 rounded-lg" />
            ))
        ) : (
          <>
            <StatusCard
              icon={Cpu}
              label="CPU Usage"
              value={`${animatedCpu}%`}
              subValue="Normal"
              variant="primary"
              trend="down"
              trendValue="-8%"
              sparklineData={[60, 55, 45, 50, 40, 35, 30, 25, 28, 24]}
              className="hover:-translate-y-1 transition-transform duration-300"
            />
            <StatusCard
              icon={MemoryStick}
              label="Memory"
              value={`${animatedMemory}%`}
              subValue="4.2 GB"
              variant="success"
              trend="up"
              trendValue="+2%"
              sparklineData={[35, 38, 40, 42, 40, 43, 41, 42, 40, 42]}
              className="hover:-translate-y-1 transition-transform duration-300"
            />
            <StatusCard
              icon={HardDrive}
              label="Disk"
              value={`${animatedDisk} GB`}
              subValue="Free"
              variant="warning"
              trend="down"
              trendValue="-5%"
              sparklineData={[180, 175, 170, 168, 165, 162, 160, 158, 157, 156]}
              className="hover:-translate-y-1 transition-transform duration-300"
            />
            <StatusCard
              icon={Wifi}
              label="Network"
              value={`${animatedNetwork} Mbps`}
              subValue="Download"
              variant="success"
              trend="up"
              trendValue="+12%"
              sparklineData={[60, 65, 70, 68, 75, 80, 82, 85, 83, 85]}
              className="hover:-translate-y-1 transition-transform duration-300"
            />
          </>
        )}
      </StaggerContainer>

      <StaggerContainer staggerDelay={100}>
        <Card>
          <CardHeader
            action={
              <div className="flex bg-bg-tertiary rounded-lg p-1">
                {(["1h", "24h", "7d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                      timeRange === r
                        ? "bg-bg-primary text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            }
          >
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Performance Monitor
              </h3>
              <p className="text-sm text-text-secondary">Real-time metrics</p>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonLoader className="h-[280px] w-full rounded-lg" />
            ) : (
              <PerformanceChart height={280} />
            )}
          </CardContent>
        </Card>
      </StaggerContainer>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h3>
        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          staggerDelay={100}
        >
          {isLoading ? (
            Array(3)
              .fill(null)
              .map((_, i) => (
                <SkeletonLoader key={i} className="h-48 rounded-lg" />
              ))
          ) : (
            <>
              <QuickActionCard
                icon={Scan}
                title="Quick Scan"
                description="Scan for junk files"
                buttonText="Start"
                onAction={() => setCurrentModule("clean")}
                variant="primary"
              />
              <QuickActionCard
                icon={Zap}
                title="Optimize RAM"
                description="Free up memory"
                buttonText="Optimize"
                onAction={() => setCurrentModule("optimize")}
                variant="success"
              />
              <QuickActionCard
                icon={Trash2}
                title="Clean Junk"
                description="Remove temp files"
                buttonText="Clean"
                onAction={() => setCurrentModule("clean")}
                variant="warning"
              />
            </>
          )}
        </StaggerContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Modules
        </h3>
        <StaggerContainer
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          staggerDelay={75}
        >
          {isLoading
            ? Array(6)
                .fill(null)
                .map((_, i) => (
                  <SkeletonLoader key={i} className="h-32 rounded-lg" />
                ))
            : moduleShortcuts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentModule(item.module)}
                  className="group bg-bg-secondary border border-border rounded-xl p-4 text-left transition-all hover:border-border-hover hover:shadow-theme hover:-translate-y-1"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all",
                      item.color,
                      "group-hover:scale-110",
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-text-primary mb-1">
                    {item.label}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {item.description}
                  </p>
                </button>
              ))}
        </StaggerContainer>
      </div>

      <StaggerContainer staggerDelay={100}>
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View All
              </Button>
            }
          >
            <h3 className="text-lg font-semibold text-text-primary">
              Recent Activity
            </h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonLoader className="h-48 w-full rounded-lg" />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        `bg-${item.color}-500/10`,
                      )}
                    >
                      <item.icon
                        className={cn("w-5 h-5", `text-${item.color}-500`)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-secondary">{item.time}</p>
                    </div>
                    <Badge variant={item.badgeVariant} size="sm">
                      {item.badge}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerContainer>
    </div>
  );
};

export default DashboardOverview;
