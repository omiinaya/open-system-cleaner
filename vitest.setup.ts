import { vi } from "vitest";

// Mock electron modules
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn((name) => {
      const paths: Record<string, string> = {
        userData: "/tmp/osc-test-user-data",
        logs: "/tmp/osc-test-logs",
        temp: "/tmp",
        home: "/home/test",
      };
      return paths[name] || "/tmp";
    }),
    getVersion: vi.fn(() => "1.0.0"),
    on: vi.fn(),
    quit: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
    trashItem: vi.fn(),
  },
  dialog: {
    showMessageBox: vi.fn(),
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

// Mock systeminformation
vi.mock("systeminformation", () => ({
  default: {
    currentLoad: vi.fn().mockResolvedValue({
      currentLoad: 25,
      cpus: [{ load: 20 }, { load: 30 }],
    }),
    mem: vi.fn().mockResolvedValue({
      total: 17179869184,
      active: 8589934592,
      available: 8589934592,
    }),
    fsSize: vi.fn().mockResolvedValue([
      {
        fs: "/",
        size: 1000000000000,
        used: 500000000000,
        available: 500000000000,
      },
    ]),
    networkStats: vi.fn().mockResolvedValue([
      {
        iface: "eth0",
        tx_sec: 1000,
        rx_sec: 2000,
      },
    ]),
    processes: vi.fn().mockResolvedValue({
      list: [
        { pid: 1, name: "init", cpu: 0, memRss: 10000, command: "/sbin/init" },
        {
          pid: 100,
          name: "chrome",
          cpu: 5,
          memRss: 500000,
          command: "/usr/bin/chrome",
        },
      ],
    }),
  },
}));

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  appendFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
  rmdir: vi.fn(),
  rename: vi.fn(),
  copyFile: vi.fn(),
  open: vi.fn(),
}));

// Mock child_process
vi.mock("child_process", () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore console logs during tests
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};
