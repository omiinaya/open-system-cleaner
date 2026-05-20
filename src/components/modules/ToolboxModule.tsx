import React, { useState } from "react";
import { cn } from "../../utils/cn";
import {
  Package,
  Download,
  Trash2,
  Copy,
  Scissors,
  Wrench,
  AlertCircle,
  HardDrive,
  ChevronRight,
} from "lucide-react";
import Card, { CardHeader, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { StatCard } from "../common";

interface Software {
  id: string;
  name: string;
  publisher: string;
  version: string;
  size: string;
  installDate: string;
  selected: boolean;
}

interface Driver {
  id: string;
  name: string;
  device: string;
  currentVersion: string;
  latestVersion: string;
  status: "up-to-date" | "update-available" | "critical";
}

const ToolboxModule: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [software] = useState<Software[]>([
    {
      id: "1",
      name: "Google Chrome",
      publisher: "Google",
      version: "120.0.0.1",
      size: "245 MB",
      installDate: "2024-01-15",
      selected: false,
    },
    {
      id: "2",
      name: "Spotify",
      publisher: "Spotify AB",
      version: "1.2.26",
      size: "189 MB",
      installDate: "2024-01-10",
      selected: false,
    },
    {
      id: "3",
      name: "Discord",
      publisher: "Discord Inc.",
      version: "1.0.9016",
      size: "312 MB",
      installDate: "2023-12-20",
      selected: false,
    },
    {
      id: "4",
      name: "VLC Media Player",
      publisher: "VideoLAN",
      version: "3.0.20",
      size: "98 MB",
      installDate: "2023-11-05",
      selected: false,
    },
  ]);

  const [drivers] = useState<Driver[]>([
    {
      id: "1",
      name: "NVIDIA Graphics Driver",
      device: "NVIDIA RTX 3060",
      currentVersion: "546.17",
      latestVersion: "546.33",
      status: "update-available",
    },
    {
      id: "2",
      name: "Intel Chipset Driver",
      device: "Intel Z790",
      currentVersion: "10.1.19439.1",
      latestVersion: "10.1.19439.1",
      status: "up-to-date",
    },
    {
      id: "3",
      name: "Realtek Audio Driver",
      device: "Realtek High Definition Audio",
      currentVersion: "6.0.9235.1",
      latestVersion: "6.0.9235.1",
      status: "up-to-date",
    },
    {
      id: "4",
      name: "Intel Wi-Fi Driver",
      device: "Intel Wi-Fi 6E",
      currentVersion: "22.230.0",
      latestVersion: "23.10.0",
      status: "critical",
    },
  ]);

  const tools = [
    {
      id: "uninstaller",
      icon: Package,
      title: "Software Uninstaller",
      description: "Remove unwanted programs completely",
      color: "primary",
    },
    {
      id: "driver",
      icon: Download,
      title: "Driver Updater",
      description: "Update device drivers",
      color: "success",
    },
    {
      id: "shredder",
      icon: Trash2,
      title: "File Shredder",
      description: "Securely delete files permanently",
      color: "danger",
    },
    {
      id: "duplicate",
      icon: Copy,
      title: "Duplicate Finder",
      description: "Find and remove duplicate files",
      color: "warning",
    },
    {
      id: "splitter",
      icon: Scissors,
      title: "File Splitter",
      description: "Split or join large files",
      color: "info",
    },
  ];

  const outdatedDrivers = drivers.filter(
    (d) => d.status !== "up-to-date",
  ).length;
  const criticalDrivers = drivers.filter((d) => d.status === "critical").length;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Wrench className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Toolbox
              </h2>
              <p className="text-text-secondary">
                Additional system utilities to manage and maintain your
                computer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={software.length.toString()}
          label="Installed Apps"
          icon={Package}
          iconColor="primary"
          size="sm"
        />
        <StatCard
          value={`${outdatedDrivers}`}
          label="Driver Updates"
          icon={Download}
          iconColor={
            criticalDrivers > 0
              ? "danger"
              : outdatedDrivers > 0
                ? "warning"
                : "success"
          }
          size="sm"
        />
        <StatCard
          value="2.4 GB"
          label="Duplicates Found"
          icon={Copy}
          iconColor="warning"
          size="sm"
        />
        <StatCard
          value="Ready"
          label="File Shredder"
          icon={Trash2}
          iconColor="success"
          size="sm"
        />
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                hoverable
                className="cursor-pointer group"
                onClick={() => setActiveTool(tool.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                        `bg-${tool.color}-500/10 text-${tool.color}-500`,
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {tool.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : activeTool === "uninstaller" ? (
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Back
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">
                  Software Uninstaller
                </h3>
                <p className="text-sm text-text-secondary">
                  Remove unwanted programs
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {software.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-bg-secondary flex items-center justify-center">
                      <span className="text-sm font-medium text-text-secondary">
                        {app.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {app.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {app.publisher} • v{app.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-text-secondary">{app.size}</p>
                      <p className="text-text-tertiary text-xs">
                        {app.installDate}
                      </p>
                    </div>
                    <Button variant="danger" size="sm">
                      Uninstall
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activeTool === "driver" ? (
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Back
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">
                  Driver Updater
                </h3>
                <p className="text-sm text-text-secondary">
                  {outdatedDrivers} drivers need updates
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {criticalDrivers > 0 && (
              <div className="mb-4 p-3 bg-danger-500/10 border border-danger-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  {criticalDrivers} critical driver updates available. Update
                  now for better security.
                </p>
              </div>
            )}
            <div className="space-y-2">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-bg-secondary flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {driver.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {driver.device}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-text-tertiary text-xs">
                        Current: {driver.currentVersion}
                      </p>
                      {driver.status !== "up-to-date" && (
                        <p className="text-success-500 text-xs">
                          Latest: {driver.latestVersion}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        driver.status === "up-to-date"
                          ? "success"
                          : driver.status === "critical"
                            ? "danger"
                            : "warning"
                      }
                      size="sm"
                    >
                      {driver.status === "up-to-date"
                        ? "Up to date"
                        : driver.status === "critical"
                          ? "Critical"
                          : "Update"}
                    </Badge>
                    {driver.status !== "up-to-date" && (
                      <Button variant="primary" size="sm">
                        Update
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activeTool === "shredder" ? (
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Back
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">
                  File Shredder
                </h3>
                <p className="text-sm text-text-secondary">
                  Securely delete files permanently
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <Trash2 className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-primary font-medium">
                Drop files here to shred
              </p>
              <p className="text-sm text-text-secondary mt-1">
                or click to browse
              </p>
            </div>
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <p className="text-sm font-medium text-text-primary mb-2">
                Shredding Options
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="radio"
                    name="shred-method"
                    defaultChecked
                    className="text-primary-500"
                  />{" "}
                  Standard (3 passes)
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="radio"
                    name="shred-method"
                    className="text-primary-500"
                  />{" "}
                  Secure (7 passes)
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="radio"
                    name="shred-method"
                    className="text-primary-500"
                  />{" "}
                  Military (35 passes)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : activeTool === "duplicate" ? (
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Back
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
                <Copy className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">
                  Duplicate File Finder
                </h3>
                <p className="text-sm text-text-secondary">
                  2.4 GB of duplicates found
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                {
                  name: "vacation_photo.jpg",
                  locations: ["C:\\Photos\\2024", "D:\\Backup\\Photos"],
                  size: "3.2 MB",
                  count: 2,
                },
                {
                  name: "document.pdf",
                  locations: ["C:\\Documents", "C:\\Downloads"],
                  size: "1.8 MB",
                  count: 2,
                },
                {
                  name: "song.mp3",
                  locations: ["C:\\Music", "D:\\Music Backup", "C:\\Downloads"],
                  size: "8.5 MB",
                  count: 3,
                },
              ].map((dup, idx) => (
                <div key={idx} className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-warning-500" />
                      <span className="font-medium text-text-primary">
                        {dup.name}
                      </span>
                    </div>
                    <Badge variant="warning" size="sm">
                      {dup.count} copies • {dup.size}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {dup.locations.map((loc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-text-secondary"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={i > 0}
                          className="rounded text-primary-500"
                        />
                        <span>{loc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="warning" fullWidth className="mt-4">
              Remove Selected Duplicates
            </Button>
          </CardContent>
        </Card>
      ) : activeTool === "splitter" ? (
        <Card>
          <CardHeader
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Back
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">
                  File Splitter
                </h3>
                <p className="text-sm text-text-secondary">
                  Split or join large files
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg-tertiary rounded-lg text-center cursor-pointer hover:border-primary-500/50 border border-transparent transition-colors">
                <Scissors className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Split File</p>
                <p className="text-xs text-text-secondary">
                  Break large files into parts
                </p>
              </div>
              <div className="p-4 bg-bg-tertiary rounded-lg text-center cursor-pointer hover:border-primary-500/50 border border-transparent transition-colors">
                <Copy className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="font-medium text-text-primary">Join Files</p>
                <p className="text-xs text-text-secondary">
                  Combine split files
                </p>
              </div>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-text-secondary">
                Drop a file here or click to browse
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ToolboxModule;
