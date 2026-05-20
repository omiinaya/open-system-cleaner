import React, { useState } from "react";
import { cn } from "../../utils/cn";
import {
  Trash2,
  FileX,
  Shield,
  Search,
  FileSearch,
  Check,
  Clock,
  HardDrive,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Card, { CardHeader, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Switch from "../ui/Switch";
import { ScanProgress } from "../common";

interface CleanFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  issues: number;
  size?: string;
}

interface ScanResult {
  category: string;
  items: ScanItem[];
}

interface ScanItem {
  id: string;
  name: string;
  path: string;
  size: string;
  selected: boolean;
}

const CleanModule: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const [issuesFound, setIssuesFound] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanComplete, setCleanComplete] = useState(false);

  const [features, setFeatures] = useState<CleanFeature[]>([
    {
      id: "junk",
      icon: <Trash2 className="w-5 h-5" />,
      title: "Junk File Cleaner",
      description:
        "Remove temporary files, browser cache, and system logs to free up disk space",
      checked: true,
      issues: 0,
      size: "0 MB",
    },
    {
      id: "registry",
      icon: <FileX className="w-5 h-5" />,
      title: "Registry Cleaner",
      description:
        "Fix invalid registry entries and broken links to improve system stability",
      checked: true,
      issues: 0,
    },
    {
      id: "privacy",
      icon: <Shield className="w-5 h-5" />,
      title: "Privacy Sweep",
      description:
        "Clear browser history, cookies, and recent documents to protect your privacy",
      checked: true,
      issues: 0,
    },
    {
      id: "large",
      icon: <FileSearch className="w-5 h-5" />,
      title: "Large File Finder",
      description: "Identify large files taking up valuable disk space",
      checked: false,
      issues: 0,
      size: "0 MB",
    },
  ]);

  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  const toggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)),
    );
  };

  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setCleanComplete(false);
    setIssuesFound(0);

    const actions = [
      "Scanning temporary files...",
      "Checking browser cache...",
      "Analyzing system logs...",
      "Scanning registry...",
      "Checking privacy traces...",
      "Analyzing large files...",
    ];

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Simulate scan results
        const mockIssues = Math.floor(Math.random() * 500) + 100;
        setIssuesFound(mockIssues);
        setScanComplete(true);
        setIsScanning(false);

        setFeatures((prev) =>
          prev.map((f) => ({
            ...f,
            issues: f.checked ? Math.floor(Math.random() * 100) + 10 : 0,
            size: f.checked
              ? `${(Math.random() * 2 + 0.1).toFixed(1)} GB`
              : "0 MB",
          })),
        );

        setScanResults([
          {
            category: "Temporary Files",
            items: [
              {
                id: "1",
                name: "Windows Temp Files",
                path: "C:\\Windows\\Temp",
                size: "245 MB",
                selected: true,
              },
              {
                id: "2",
                name: "User Temp Files",
                path: "C:\\Users\\Admin\\AppData\\Local\\Temp",
                size: "128 MB",
                selected: true,
              },
            ],
          },
          {
            category: "Browser Cache",
            items: [
              {
                id: "3",
                name: "Chrome Cache",
                path: "...\\Chrome\\User Data\\Cache",
                size: "312 MB",
                selected: true,
              },
              {
                id: "4",
                name: "Firefox Cache",
                path: "...\\Firefox\\Profiles\\cache2",
                size: "89 MB",
                selected: true,
              },
            ],
          },
        ]);
      }

      setScanProgress(progress);
      setCurrentAction(
        actions[Math.floor((progress / 100) * actions.length)] ||
          "Finalizing...",
      );
    }, 200);
  };

  const handleClean = () => {
    setIsCleaning(true);
    setCurrentAction("Cleaning selected items...");

    setTimeout(() => {
      setIsCleaning(false);
      setCleanComplete(true);
      setFeatures((prev) =>
        prev.map((f) => ({ ...f, issues: 0, size: "0 MB" })),
      );
      setIssuesFound(0);
    }, 3000);
  };

  const handleRescan = () => {
    setScanComplete(false);
    setCleanComplete(false);
    setScanResults([]);
    handleScan();
  };

  const selectedFeatures = features.filter((f) => f.checked);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">
                System Cleaner
              </h2>
              <p className="text-text-secondary">
                Scan and clean junk files, registry issues, and privacy traces
                to improve system performance and free up disk space.
              </p>
            </div>
            <div className="flex-shrink-0">
              {!scanComplete && !isScanning && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleScan}
                  leftIcon={<Search className="w-5 h-5" />}
                  disabled={selectedFeatures.length === 0}
                >
                  Scan Now
                </Button>
              )}
              {scanComplete && !cleanComplete && (
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleClean}
                  loading={isCleaning}
                  leftIcon={<Trash2 className="w-5 h-5" />}
                  disabled={issuesFound === 0}
                >
                  Clean {issuesFound > 0 && `${issuesFound} Issues`}
                </Button>
              )}
              {cleanComplete && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRescan}
                  leftIcon={<RotateCcw className="w-5 h-5" />}
                >
                  Scan Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Progress */}
      {(isScanning || (scanComplete && !cleanComplete)) && (
        <ScanProgress
          isScanning={isScanning}
          progress={scanProgress}
          currentAction={currentAction}
          itemsScanned={Math.floor((scanProgress / 100) * 15000)}
          totalItems={15000}
          issuesFound={issuesFound}
          onCancel={() => setIsScanning(false)}
          variant="clean"
        />
      )}

      {/* Clean Complete Message */}
      {cleanComplete && (
        <Card variant="success" className="animate-slide-up">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-success-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Cleaning Complete!
              </h3>
              <p className="text-text-secondary">
                Successfully cleaned all selected items. Your system is now
                optimized.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className={cn(
              "transition-all duration-200",
              !feature.checked && "opacity-60",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    feature.checked
                      ? "bg-primary-500/10 text-primary-500"
                      : "bg-bg-tertiary text-text-tertiary",
                  )}
                >
                  {feature.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={feature.checked}
                      onCheckedChange={() => toggleFeature(feature.id)}
                      size="sm"
                    />
                  </div>

                  {scanComplete && feature.checked && (
                    <div className="mt-3 flex items-center gap-3">
                      {feature.issues > 0 ? (
                        <>
                          <Badge variant="warning" size="sm" dot>
                            {feature.issues} issues
                          </Badge>
                          {feature.size && feature.size !== "0 MB" && (
                            <Badge variant="default" size="sm">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {feature.size}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="success" size="sm">
                          <Check className="w-3 h-3 mr-1" />
                          Clean
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scan Results */}
      {scanComplete && scanResults.length > 0 && !cleanComplete && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Scan Results
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanResults.map((result, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg overflow-hidden"
              >
                <div className="bg-bg-tertiary px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-text-primary">
                    {result.category}
                  </span>
                  <Badge variant="warning" size="sm">
                    {result.items.length} items
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {result.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {item.name}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {item.path}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {item.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last Scan Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
        <Clock className="w-4 h-4" />
        <span>Last scan: {scanComplete ? "Just now" : "Never"}</span>
      </div>
    </div>
  );
};

export default CleanModule;
