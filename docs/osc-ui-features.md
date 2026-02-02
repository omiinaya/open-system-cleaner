# OSC UI Features Documentation

This document provides a comprehensive overview of all UI features in the OSC (Open Source System Care) project.

## Table of Contents

1. [Main Application Structure](#1-main-application-structure)
2. [Layout Components](#2-layout-components)
3. [Dashboard Features](#3-dashboard-features)
4. [Clean Module Features](#4-clean-module-features)
5. [Optimize Module Features](#5-optimize-module-features)
6. [Protect Module Features](#6-protect-module-features)
7. [Speed Up Module Features](#7-speed-up-module-features)
8. [Toolbox Module Features](#8-toolbox-module-features)
9. [Settings Module Features](#9-settings-module-features)
10. [Common UI Components](#10-common-ui-components)
11. [UI Components](#11-ui-components)
12. [State Management](#12-state-management)
13. [Summary](#13-summary)

---

## 1. Main Application Structure

### App Component
**File:** [`src/App.tsx`](src/App.tsx)

The main application component that orchestrates the entire UI.

**Features:**
- **Theme Management**: Automatically applies dark/light theme to document root using [`useThemeStore`](src/stores/themeStore.ts)
- **Module Routing**: Dynamically renders different modules based on current navigation state using [`useNavigationStore`](src/stores/navigationStore.ts)
- **Module Switching**: Supports 7 modules: Dashboard, Clean, Optimize, Protect, Speed Up, Toolbox, and Settings
- **Fade-in Animation**: Wraps module content in [`animate-fade-in`](src/styles/globals.css) class for smooth transitions

**Notable Functionality:**
- Uses `useEffect` to toggle dark mode class on `document.documentElement`
- Implements a switch statement for module rendering with fallback to Dashboard
- Passes module change handler to [`MainLayout`](src/components/layout/MainLayout.tsx)

---

## 2. Layout Components

### MainLayout
**File:** [`src/components/layout/MainLayout.tsx`](src/components/layout/MainLayout.tsx)

The primary layout wrapper that provides the application structure.

**Features:**
- **Responsive Layout**: Full-screen flex container with overflow handling
- **Sidebar Integration**: Includes collapsible [`Sidebar`](src/components/layout/Sidebar.tsx) component
- **Header Integration**: Includes [`Header`](src/components/layout/Header.tsx) component with dynamic titles
- **Content Area**: Scrollable main content area with max-width container
- **Module Title Mapping**: Maps module IDs to human-readable titles

**Notable Functionality:**
- Manages sidebar collapse state with smooth 300ms transitions
- Width changes from 260px (expanded) to 72px (collapsed)
- Supports custom page titles or uses module-based defaults

### Sidebar
**File:** [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx)

The main navigation sidebar with collapsible functionality.

**Features:**
- **Collapsible Design**: Toggle between expanded and collapsed states
- **Navigation Items**: 6 main navigation items with icons and labels
- **Active State**: Visual indication of current module with primary color highlighting
- **Settings Access**: Dedicated settings button in bottom section
- **Logo Display**: OSC branding with gradient background
- **Badge Support**: Optional badges for navigation items

**Navigation Items:**
1. Overview (Dashboard) - [`LayoutDashboard`](src/components/layout/Sidebar.tsx:34) icon
2. Clean - [`Sparkles`](src/components/layout/Sidebar.tsx:39) icon
3. Optimize - [`Zap`](src/components/layout/Sidebar.tsx:44) icon
4. Protect - [`Shield`](src/components/layout/Sidebar.tsx:49) icon
5. Speed Up - [`Gauge`](src/components/layout/Sidebar.tsx:54) icon
6. Toolbox - [`Wrench`](src/components/layout/Sidebar.tsx:59) icon

**Notable Functionality:**
- Smooth transitions (300ms) for collapse/expand
- Hover effects with background color changes
- Tooltip support when collapsed
- Gradient logo background (primary-500 to primary-600)

### Header
**File:** [`src/components/layout/Header.tsx`](src/components/layout/Header.tsx)

The top header bar with theme toggle and window controls.

**Features:**
- **Theme Toggle**: Switch between dark and light modes with Sun/Moon icons
- **Window Controls**: Optional Electron window controls (minimize, maximize, close)
- **Dynamic Title**: Displays current module or custom page title
- **Focus States**: Proper focus rings for accessibility

**Notable Functionality:**
- Integrates with [`useThemeStore`](src/stores/themeStore.ts) for theme state
- Electron API integration for window management
- Conditional rendering of window controls based on `showWindowControls` prop
- Hover effects with color transitions

---

## 3. Dashboard Features

### DashboardOverview
**File:** [`src/components/dashboard/DashboardOverview.tsx`](src/components/dashboard/DashboardOverview.tsx)

The main dashboard view providing system overview and quick actions.

**Features:**
- **Health Score Gauge**: Large animated gauge showing system health score (85)
- **Status Cards**: 4 real-time system metrics with sparkline charts
- **Performance Chart**: Real-time area chart showing CPU, Memory, and Disk usage
- **Quick Actions**: 3 action cards for common tasks
- **Module Shortcuts**: 6 module cards for quick navigation
- **Recent Activity**: List of recent system activities with badges
- **Loading States**: Skeleton loaders during initial load
- **Staggered Animations**: [`StaggerContainer`](src/components/dashboard/DashboardOverview.tsx:43) for smooth entry animations

**Status Cards:**
1. CPU Usage - [`Cpu`](src/components/dashboard/DashboardOverview.tsx:138) icon, 24%, trend down
2. Memory - [`MemoryStick`](src/components/dashboard/DashboardOverview.tsx:139) icon, 42%, trend up
3. Disk - [`HardDrive`](src/components/dashboard/DashboardOverview.tsx:140) icon, 156 GB free, trend down
4. Network - [`Wifi`](src/components/dashboard/DashboardOverview.tsx:141) icon, 85 Mbps, trend up

**Quick Actions:**
1. Quick Scan - [`Scan`](src/components/dashboard/DashboardOverview.tsx:160) icon, navigates to Clean module
2. Optimize RAM - [`Zap`](src/components/dashboard/DashboardOverview.tsx:161) icon, navigates to Optimize module
3. Clean Junk - [`Trash2`](src/components/dashboard/DashboardOverview.tsx:162) icon, navigates to Clean module

**Notable Functionality:**
- Animated counters using [`useAnimatedCounter`](src/components/dashboard/DashboardOverview.tsx:17) hook
- Time range selector for performance chart (1h, 24h, 7d)
- Gradient background effects with blur
- Hover animations on cards (translate-y-1)
- Badge system for issues, cleanable space, and security alerts

### HealthScoreGauge
**File:** [`src/components/dashboard/HealthScoreGauge.tsx`](src/components/dashboard/HealthScoreGauge.tsx)

A circular gauge component for displaying health scores.

**Features:**
- **Three Sizes**: sm (80px), md (128px), lg (180px)
- **Animated Progress**: Smooth animation from 0 to target score
- **Color Coding**: Dynamic colors based on score (danger ≤40, warning ≤70, success >70)
- **Status Text**: Displays Critical, Fair, or Excellent based on score
- **Optional Label**: Can show/hide "Score" label
- **SVG-based**: Uses SVG circles for crisp rendering

**Notable Functionality:**
- 60-step animation over 1000ms duration
- Stroke dashoffset animation for progress effect
- Rotated SVG (-90deg) for proper gauge orientation
- Responsive sizing with configurable dimensions

### PerformanceChart
**File:** [`src/components/dashboard/PerformanceChart.tsx`](src/components/dashboard/PerformanceChart.tsx)

Real-time performance monitoring chart using Recharts.

**Features:**
- **Real-time Updates**: Updates every second with simulated data
- **Three Metrics**: CPU, Memory, and Disk usage
- **Area Chart**: Filled area chart with gradients
- **Custom Tooltip**: Styled tooltip showing all metrics
- **Responsive**: Uses [`ResponsiveContainer`](src/components/dashboard/PerformanceChart.tsx:122) for adaptive sizing
- **Grid Lines**: Optional horizontal grid lines
- **Legend**: Toggleable legend display

**Notable Functionality:**
- Generates 60 initial data points
- Sliding window (keeps last 60 points)
- Gradient fills for each metric
- Custom tooltip with color-coded indicators
- Configurable height, animation, and grid display

### QuickActionCard
**File:** [`src/components/dashboard/QuickActionCard.tsx`](src/components/dashboard/QuickActionCard.tsx)

Action cards for quick access to common tasks.

**Features:**
- **Five Variants**: primary, success, warning, danger, info
- **Icon Display**: Large icon with colored background
- **Action Button**: Integrated button with loading state
- **Hover Effects**: Glow effect and translate animation
- **Disabled State**: Visual feedback when disabled
- **Loading State**: Spinner animation during action

**Notable Functionality:**
- Glow effect on hover (30px blur)
- Icon scale animation (1.1x)
- Border color transition
- Button inherits variant color
- Supports custom action handlers

### StatusCard
**File:** [`src/components/dashboard/StatusCard.tsx`](src/components/dashboard/StatusCard.tsx)

Metric cards with sparkline charts and trend indicators.

**Features:**
- **Five Variants**: default, primary, success, warning, danger
- **Sparkline Chart**: Mini SVG sparkline showing data trend
- **Trend Indicators**: Up, down, or neutral with color coding
- **Icon Display**: Colored icon background based on variant
- **Sub-value**: Additional information below main value
- **Clickable**: Optional click handler for interactivity

**Notable Functionality:**
- Dynamic sparkline path generation
- Trend icons (↑, ↓, →)
- Color-coded trend values
- Hover effects with border and shadow
- Responsive sparkline sizing (60x24)

---

## 4. Clean Module Features

### CleanModule
**File:** [`src/components/modules/CleanModule.tsx`](src/components/modules/CleanModule.tsx)

System cleaning module for junk files, registry, and privacy.

**Features:**
- **Scan Progress**: Real-time scanning progress with [`ScanProgress`](src/components/common/ScanProgress.tsx) component
- **Four Clean Features**: Toggleable cleaning options
- **Scan Results**: Detailed breakdown of found items by category
- **Clean Complete**: Success message after cleaning
- **Feature Toggles**: [`Switch`](src/components/ui/Switch.tsx) controls for each feature
- **Issue Counting**: Shows number of issues found per feature
- **Size Display**: Shows cleanable space per feature

**Clean Features:**
1. Junk File Cleaner - [`Trash2`](src/components/modules/CleanModule.tsx:56) icon, removes temp files, cache, logs
2. Registry Cleaner - [`FileX`](src/components/modules/CleanModule.tsx:65) icon, fixes invalid entries
3. Privacy Sweep - [`Shield`](src/components/modules/CleanModule.tsx:73) icon, clears browser history
4. Large File Finder - [`FileSearch`](src/components/modules/CleanModule.tsx:81) icon, identifies large files

**Scan Actions:**
- Scan Now button with [`Search`](src/components/modules/CleanModule.tsx:207) icon
- Clean button with issue count
- Scan Again button after completion

**Notable Functionality:**
- Simulated scanning with progress updates
- Mock scan results with categories and items
- Animated progress bar with current action display
- Badge system for issues and sizes
- Last scan timestamp display

---

## 5. Optimize Module Features

### OptimizeModule
**File:** [`src/components/modules/OptimizeModule.tsx`](src/components/modules/OptimizeModule.tsx)

System optimization module for performance tuning.

**Features:**
- **Startup Manager**: Manage startup programs with impact ratings
- **RAM Optimizer**: Free up memory with progress visualization
- **Internet Booster**: Optimize network settings with toggles
- **Disk Defrag**: Analyze and defragment drives
- **Optimize All**: One-click optimization for all features
- **Stat Cards**: Quick stats for startup programs, RAM, latency, defrag needs

**Startup Manager:**
- Program list with publisher and impact (low/medium/high)
- Toggle switches for each program
- High-impact warning alert
- Expandable details view

**RAM Optimizer:**
- Current usage percentage with color coding
- Progress bar with threshold colors
- Total/Used/Free breakdown
- Optimize button with animation

**Internet Booster:**
- DNS Optimization toggle
- TCP Optimization toggle
- Browser Optimization toggle

**Disk Defrag:**
- Drive list with type (SSD/HDD)
- Fragmentation percentage
- Usage progress bar
- Defrag button (HDD only)

**Notable Functionality:**
- Animated RAM optimization
- Impact badges (danger for high, warning for medium, success for low)
- Drive type badges (SSD/HDD)
- Progress-based color changes
- Real-time stat updates

---

## 6. Protect Module Features

### ProtectModule
**File:** [`src/components/modules/ProtectModule.tsx`](src/components/modules/ProtectModule.tsx)

Security module for vulnerability protection and privacy.

**Features:**
- **Security Score**: Large score display with color coding
- **Vulnerability Scanner**: Quick and Full scan options
- **System Hardening Monitor**: Toggle for continuous monitoring
- **Firewall**: Toggle for network traffic control
- **Six Protection Features**: Individual toggles for various protections
- **Vulnerability Detection**: Alert system for found vulnerabilities
- **Scan Progress**: Real-time scanning with [`ScanProgress`](src/components/common/ScanProgress.tsx)

**Protection Features:**
1. Anti-Tracking - [`Eye`](src/components/modules/ProtectModule.tsx:30) icon, blocks online tracking
2. Anti-Phishing - [`Globe`](src/components/modules/ProtectModule.tsx:31) icon, protects against phishing (Critical)
3. Camera Protection - [`Camera`](src/components/modules/ProtectModule.tsx:32) icon, blocks unauthorized access
4. Microphone Protection - [`Mic`](src/components/modules/ProtectModule.tsx:33) icon, blocks unauthorized access
5. Keystroke Encryption - [`Keyboard`](src/components/modules/ProtectModule.tsx:34) icon, prevents keyloggers
6. Homepage Protection - [`Lock`](src/components/modules/ProtectModule.tsx:35) icon, prevents homepage changes

**Scan Types:**
- Quick Scan (~2 minutes) - [`Zap`](src/components/modules/ProtectModule.tsx:127) icon
- Full Scan (~30-60 minutes) - [`Activity`](src/components/modules/ProtectModule.tsx:138) icon

**Notable Functionality:**
- Dynamic security score based on vulnerabilities found
- Status badges (Protected, At Risk, Critical)
- Pulse animation on warning badges
- Vulnerability remediation workflow
- System hardening monitor status indicator

---

## 7. Speed Up Module Features

### SpeedUpModule
**File:** [`src/components/modules/SpeedUpModule.tsx`](src/components/modules/SpeedUpModule.tsx)

Performance boosting module for gaming and general speed.

**Features:**
- **Turbo Mode**: One-click maximum performance activation
- **Game Mode**: System optimization for gaming
- **Game Booster**: List of games with optimization status
- **Performance Monitor**: Real-time CPU, Memory, Disk usage
- **Process Manager**: View and manage background processes
- **Stat Cards**: Quick stats for turbo mode, game mode, optimized games, processes

**Game Booster:**
- Game list with path and optimization status
- Toggle for Game Mode
- Optimization badges

**Performance Monitor:**
- CPU Usage progress bar
- Memory Usage progress bar
- Disk Usage progress bar
- Color-coded based on usage level

**Process Manager:**
- Process list with PID, CPU, Memory
- Kill button for each process
- Expandable view (show/hide all)

**Turbo Mode:**
- Toggle activation
- Feature list (visual effects, CPU priority, RAM freeing, background updates)
- Visual feedback when active

**Notable Functionality:**
- Turbo mode visual state change
- Game mode toggle
- Process termination buttons
- Real-time performance metrics
- Hover effects on process items

---

## 8. Toolbox Module Features

### ToolboxModule
**File:** [`src/components/modules/ToolboxModule.tsx`](src/components/modules/ToolboxModule.tsx)

Utility module with various system tools.

**Features:**
- **Tool Selection**: 5 utility tools with icons and descriptions
- **Software Uninstaller**: List of installed programs with uninstall buttons
- **Driver Updater**: Driver list with update status and update buttons
- **File Shredder**: Secure file deletion with multiple pass options
- **Duplicate Finder**: List of duplicate files with location selection
- **File Splitter**: Split or join large files
- **Stat Cards**: Quick stats for installed apps, driver updates, duplicates, shredder

**Tools:**
1. Software Uninstaller - [`Package`](src/components/modules/ToolboxModule.tsx:47) icon, remove unwanted programs
2. Driver Updater - [`Download`](src/components/modules/ToolboxModule.tsx:48) icon, update device drivers
3. File Shredder - [`Trash2`](src/components/modules/ToolboxModule.tsx:49) icon, securely delete files
4. Duplicate Finder - [`Copy`](src/components/modules/ToolboxModule.tsx:50) icon, find duplicate files
5. File Splitter - [`Scissors`](src/components/modules/ToolboxModule.tsx:51) icon, split/join files

**Software Uninstaller:**
- App list with publisher, version, size, install date
- Uninstall button for each app

**Driver Updater:**
- Driver list with device, current version, latest version
- Status badges (Up to date, Update, Critical)
- Update button for outdated drivers
- Critical update alert

**File Shredder:**
- Drag and drop zone
- Three shredding methods: Standard (3 passes), Secure (7 passes), Military (35 passes)

**Duplicate Finder:**
- Duplicate file list with locations and sizes
- Checkboxes for selecting copies to remove
- Remove selected button

**File Splitter:**
- Split File option
- Join Files option
- File drop zone

**Notable Functionality:**
- Tool selection with back navigation
- Hover effects on tool cards
- Status-based color coding
- Checkbox selection for duplicates
- Radio buttons for shredding method

---

## 9. Settings Module Features

### SettingsModule
**File:** [`src/components/modules/SettingsModule.tsx`](src/components/modules/SettingsModule.tsx)

Settings module for application configuration.

**Features:**
- **Section Navigation**: 5 settings sections with icons
- **General Settings**: Language, dark mode, startup, auto-update
- **Notifications**: Enable/disable various notification types
- **Privacy**: Data sharing, browsing data, password protection
- **Scan Settings**: Auto scan, schedule, scan at startup
- **About**: Version information and credits

**Settings Sections:**
1. General - [`Settings`](src/components/modules/SettingsModule.tsx:43) icon, language, startup, updates
2. Notifications - [`Bell`](src/components/modules/SettingsModule.tsx:44) icon, alerts and sounds
3. Privacy - [`Shield`](src/components/modules/SettingsModule.tsx:45) icon, data collection, history
4. Scan Settings - [`RefreshCw`](src/components/modules/SettingsModule.tsx:46) icon, schedule, what to scan
5. About - [`Info`](src/components/modules/SettingsModule.tsx:47) icon, version, credits

**General Settings:**
- Language dropdown (English, Spanish, French, German)
- Dark Mode toggle (integrates with [`useThemeStore`](src/stores/themeStore.ts))
- Start with Windows toggle
- Auto Update toggle

**Notifications:**
- Enable Notifications toggle
- Scan Complete toggle
- Optimization Complete toggle
- Security Alerts toggle
- Sound Effects toggle

**Privacy:**
- Share Usage Data toggle
- Auto Clean Browsing Data toggle
- Password Protection toggle

**Scan Settings:**
- Automatic Scan toggle
- Scan Schedule dropdown (Daily, Weekly, Monthly)
- Scan at Startup toggle

**About:**
- App logo and name
- Version badge
- Version, Build Date, License information

**Notable Functionality:**
- Sidebar navigation for sections
- Active section highlighting
- Conditional rendering based on toggles
- Integration with theme store
- Responsive layout (4 columns on large screens)

---

## 10. Common UI Components

### FeatureCard
**File:** [`src/components/common/FeatureCard.tsx`](src/components/common/FeatureCard.tsx)

Reusable card component for displaying features with toggle switches.

**Features:**
- **Four Statuses**: enabled, disabled, warning, error
- **Three Sizes**: sm, md, lg
- **Toggle Switch**: Optional switch for on/off control
- **Badge Support**: Optional badge with variant
- **Status Indicator**: Visual indicator based on status
- **Action Area**: Optional action area at bottom

**Status Configurations:**
- enabled: Success color with check icon
- disabled: Tertiary color, no indicator
- warning: Warning color with alert icon
- error: Danger color with alert icon

**Notable Functionality:**
- Icon background color based on status
- Disabled state with opacity
- Hover effects on border
- Responsive padding based on size

### ScanProgress
**File:** [`src/components/common/ScanProgress.tsx`](src/components/common/ScanProgress.tsx)

Progress component for scanning operations.

**Features:**
- **Three Variants**: clean, optimize, protect
- **Animated Dots**: Animated ellipsis for scanning text
- **Progress Bar**: Large animated progress bar
- **Stats Display**: Items scanned, total items, percentage
- **Issue Counter**: Badge showing issues found
- **Cancel Button**: Optional cancel button during scan
- **Completion States**: Different displays for complete vs. scanning

**Variant Configurations:**
- clean: Primary color, "Scanning System" title
- optimize: Success color, "Optimizing System" title
- protect: Warning color, "Scanning for Vulnerabilities" title

**Notable Functionality:**
- Animated dots (400ms interval)
- Spinning loader icon during scan
- Check icon on completion
- Pulsing badge for issues
- Slide-up animation

### StatCard
**File:** [`src/components/common/StatCard.tsx`](src/components/common/StatCard.tsx)

Metric card for displaying statistics.

**Features:**
- **Five Icon Colors**: primary, success, warning, danger, info
- **Three Sizes**: sm, md, lg
- **Trend Indicators**: Up, down, or neutral with icons
- **Icon Display**: Optional icon with colored background
- **Trend Label**: Optional label for trend context
- **Hover Effects**: Border color transition

**Trend Configurations:**
- up: Success color with arrow up icon
- down: Danger color with arrow down icon
- neutral: Tertiary color with minus icon

**Notable Functionality:**
- Trend badge with background color
- Icon background based on color variant
- Responsive sizing
- Hover border effect

---

## 11. UI Components

### Button
**File:** [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx)

Reusable button component with multiple variants and states.

**Features:**
- **Six Variants**: primary, secondary, success, warning, danger, ghost
- **Three Sizes**: sm, md, lg
- **Loading State**: Spinner animation with disabled state
- **Icon Support**: Left and right icon slots
- **Full Width**: Optional full-width display
- **Focus States**: Proper focus rings for accessibility

**Variant Styles:**
- primary: Primary background with white text, shadow
- secondary: Tertiary background with border
- success: Success background with white text
- warning: Warning background with white text
- danger: Danger background with white text
- ghost: Transparent with hover background

**Notable Functionality:**
- Active scale animation (0.98)
- Disabled state with opacity
- Loading spinner replaces content
- Icon spacing with gap
- Focus ring with offset

### Card
**File:** [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx)

Container component with header, content, and footer sections.

**Features:**
- **Five Variants**: default, info, success, warning, danger
- **Four Padding Options**: none, sm, md, lg
- **Hoverable**: Optional hover effect with shadow
- **Sub-components**: CardHeader, CardContent, CardFooter
- **Action Slot**: Header action area for buttons

**Variant Border Colors:**
- default: Default border
- info: Primary border
- success: Success border
- warning: Warning border
- danger: Danger border

**Notable Functionality:**
- Header with flex layout for action
- Footer with top border
- Hover shadow and border transition
- Responsive padding

### Badge
**File:** [`src/components/ui/Badge.tsx`](src/components/ui/Badge.tsx)

Small status indicator component.

**Features:**
- **Six Variants**: default, primary, success, warning, danger, info
- **Two Sizes**: sm, md
- **Dot Indicator**: Optional colored dot
- **Pulse Animation**: Optional pulsing dot
- **Rounded**: Full rounded corners

**Variant Styles:**
- default: Tertiary background with border
- primary: Primary background
- success: Success background
- warning: Warning background
- danger: Danger background
- info: Blue background

**Notable Functionality:**
- Dot with variant color
- Pulse animation on dot
- Gap between dot and text
- Dark mode support

### Progress
**File:** [`src/components/ui/Progress.tsx`](src/components/ui/Progress.tsx)

Progress bar component for displaying completion.

**Features:**
- **Four Colors**: primary, success, warning, danger
- **Three Sizes**: sm, md, lg
- **Label Display**: Optional inside or outside label
- **Animated**: Smooth transition animation
- **Striped**: Optional striped pattern
- **ARIA Attributes**: Proper accessibility attributes

**Size Heights:**
- sm: 6px (h-1.5)
- md: 10px (h-2.5)
- lg: 16px (h-4)

**Notable Functionality:**
- Percentage calculation with clamping
- Transition animation (300ms ease-out)
- Inside label only on lg size
- Outside label with progress text
- Role and ARIA attributes for accessibility

### Switch
**File:** [`src/components/ui/Switch.tsx`](src/components/ui/Switch.tsx)

Toggle switch component for binary choices.

**Features:**
- **Three Sizes**: sm, md, lg
- **Label Support**: Optional label and description
- **Controlled/Uncontrolled**: Supports both checked and defaultChecked
- **Disabled State**: Visual feedback when disabled
- **Focus States**: Focus ring for accessibility
- **Smooth Animation**: Thumb transition animation

**Size Dimensions:**
- sm: 32x16px track, 12x12px thumb
- md: 44x24px track, 20x20px thumb
- lg: 56x28px track, 24x24px thumb

**Notable Functionality:**
- Peer-checked styling for thumb position
- Focus ring with offset
- Disabled opacity and cursor
- Label association with htmlFor
- Description text below label

### Tooltip
**File:** [`src/components/ui/Tooltip.tsx`](src/components/ui/Tooltip.tsx)

Tooltip component for displaying additional information on hover.

**Features:**
- **Positioning**: Supports various positions
- **Delay**: Optional delay before showing
- **Arrow**: Optional arrow indicator
- **Animation**: Smooth fade-in animation

**Notable Functionality:**
- Hover trigger
- Portal rendering for z-index
- Auto-positioning
- Escape key dismissal

---

## 12. State Management

### Theme Store
**File:** [`src/stores/themeStore.ts`](src/stores/themeStore.ts)

Zustand store for managing theme state.

**Features:**
- **Dark Mode Toggle**: Switch between light and dark themes
- **Persistent State**: Persists theme preference
- **Reactive Updates**: Components automatically update on theme change

**State:**
- `isDark`: Boolean indicating dark mode status

**Actions:**
- `toggleTheme()`: Switches between light and dark modes

### Navigation Store
**File:** [`src/stores/navigationStore.ts`](src/stores/navigationStore.ts)

Zustand store for managing navigation state.

**Features:**
- **Current Module**: Tracks active module
- **Module Switching**: Change between modules
- **Type Safety**: Uses ModuleType for type safety

**State:**
- `currentModule`: Current active module (ModuleType)

**Actions:**
- `setCurrentModule()`: Sets the current module

**Module Types:**
- dashboard
- clean
- optimize
- protect
- speedup
- toolbox
- settings

---

## 13. Summary

The OSC UI features a comprehensive system care application with the following key characteristics:

### Architecture
- **Component-based**: Modular React components with clear separation of concerns
- **State Management**: Zustand stores for theme and navigation
- **Type Safety**: TypeScript throughout the codebase
- **Responsive Design**: Mobile-friendly layouts with Tailwind CSS

### Design System
- **Color Variants**: Primary, success, warning, danger, info colors
- **Size Variants**: Sm, md, lg sizes for consistent scaling
- **Dark Mode**: Full dark mode support with theme store
- **Animations**: Smooth transitions and hover effects

### Key Features
- **7 Main Modules**: Dashboard, Clean, Optimize, Protect, Speed Up, Toolbox, Settings
- **Real-time Monitoring**: Performance charts and status cards
- **Scanning Capabilities**: Multiple scan types with progress tracking
- **Optimization Tools**: RAM optimizer, startup manager, disk defrag
- **Security Features**: Vulnerability scanner, system hardening monitor, firewall
- **Utility Tools**: Software uninstaller, driver updater, file shredder

### UI Components
- **Reusable Components**: Button, Card, Badge, Progress, Switch, Tooltip
- **Common Components**: FeatureCard, ScanProgress, StatCard
- **Dashboard Components**: HealthScoreGauge, PerformanceChart, QuickActionCard, StatusCard
- **Layout Components**: MainLayout, Sidebar, Header

### User Experience
- **Loading States**: Skeleton loaders and spinners
- **Feedback**: Badges, alerts, and completion messages
- **Accessibility**: Focus states, ARIA attributes, keyboard navigation
- **Animations**: Fade-in, slide-up, stagger animations

The application provides a complete system care solution with a modern, responsive UI and comprehensive feature set for maintaining and optimizing system performance.
