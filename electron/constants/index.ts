/**
 * Application constants
 */
export const CONSTANTS = {
  // File sizes
  MIN_FILE_SIZE_BYTES: 1024,
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB

  // Timing
  METRICS_UPDATE_INTERVAL_MS: 5000 as number,
  MAX_HISTORY_DAYS: 30 as number,
  CACHE_TTL_MS: 1000 as number, // 1 second

  // Thresholds
  LOW_DISK_SPACE_GB: 1,
  HIGH_CPU_PERCENTAGE: 80,
  HIGH_MEMORY_PERCENTAGE: 85,
  CRITICAL_DISK_PERCENTAGE: 90,

  // Scanning
  MAX_SCAN_DEPTH: 5,
  MAX_FILES_TO_SCAN: 10000,

  // Protected file extensions
  PROTECTED_EXTENSIONS: [
    '.exe', '.dll', '.sys', '.drv', // System files
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // Office
    '.pdf', '.pst', '.ost', // Email/Documents
    '.db', '.sql', '.sqlite', // Databases
    '.key', '.pem', '.p12', '.pfx', // Certificates
  ] as string[],

  // System directories to skip
  SYSTEM_DIRECTORIES: [
    'System32',
    'SysWOW64',
    'Windows',
    'ProgramData',
    'node_modules',
    '.git',
    '$Recycle.Bin',
    'Recovery',
  ],

  // Process whitelist (never kill these)
  PROCESS_WHITELIST: [
    'System',
    'System Idle Process',
    'explorer.exe',
    'winlogon.exe',
    'csrss.exe',
    'smss.exe',
    'services.exe',
    'lsass.exe',
    'svchost.exe',
    'chrome.exe',
    'firefox.exe',
    'msedge.exe',
    'code.exe',
  ],

  // Process blacklist (safe to kill)
  PROCESS_BLACKLIST: [
    'notepad.exe',
    'calc.exe',
    'mspaint.exe',
    'cmd.exe',
    'powershell.exe',
    'discord.exe',
    'spotify.exe',
    'steam.exe',
    'slack.exe',
    'teams.exe',
    'zoom.exe',
  ],
} as const;
