# Getting Started with OSC System Care

Welcome to OSC System Care - the open-source system optimization tool that helps you clean, optimize, and protect your computer.

## Table of Contents
1. [Installation](#installation)
2. [First Launch](#first-launch)
3. [Dashboard Overview](#dashboard-overview)
4. [Quick Start Guide](#quick-start-guide)
5. [System Requirements](#system-requirements)

## Installation

### Windows
1. Download the MSI installer from the [releases page](https://github.com/yourusername/osc-system-care/releases)
2. Run the installer and follow the setup wizard
3. Alternatively, use the portable version which requires no installation

### macOS
1. Download the DMG file from the [releases page](https://github.com/yourusername/osc-system-care/releases)
2. Open the DMG and drag OSC System Care to your Applications folder
3. **Note:** On first launch, you may need to right-click and select "Open" to bypass Gatekeeper

### Linux
**AppImage (Recommended):**
1. Download the AppImage file
2. Make it executable: `chmod +x OSC-System-Care-*.AppImage`
3. Double-click to run

**Debian/Ubuntu:**
```bash
sudo dpkg -i osc-system-care_*.deb
sudo apt-get install -f  # Install dependencies
```

**Fedora/RHEL:**
```bash
sudo rpm -i osc-system-care_*.rpm
```

**Snap:**
```bash
sudo snap install osc-system-care
```

**Flatpak:**
```bash
flatpak install flathub com.osc.systemcare
```

## First Launch

When you first open OSC System Care:

1. **Welcome Screen** - You'll see a brief introduction to the application
2. **System Scan** - We recommend running an initial system scan to establish a baseline
3. **Dashboard** - After the scan, you'll be taken to the main dashboard

### Granting Permissions

**Windows:**
- The app may request administrator privileges for certain optimizations
- Grant these permissions for full functionality

**macOS:**
- Grant "Full Disk Access" in System Preferences > Security & Privacy > Privacy
- This is required for the app to scan and clean your system

**Linux:**
- Some features may require sudo access
- You'll be prompted when elevation is needed

## Dashboard Overview

The Dashboard provides a quick overview of your system's health:

### Health Score
- **0-40 (Red):** Your system needs attention
- **41-70 (Yellow):** Some optimizations recommended
- **71-100 (Green):** Your system is in good shape

### System Metrics
- **CPU Usage:** Real-time processor utilization
- **Memory:** RAM usage and availability
- **Disk:** Storage usage across all drives
- **Network:** Upload/download speeds

### Quick Actions
Access common tasks with one click:
- Quick Scan
- Clean Junk Files
- Optimize Memory
- Update Software

## Quick Start Guide

### 1. Run Your First Scan
1. Click "Scan Now" on the Dashboard
2. Wait for the scan to complete (usually 1-5 minutes)
3. Review the results and recommendations

### 2. Clean Your System
1. Go to the **Clean** tab
2. Select what you want to clean (junk files, registry, privacy data)
3. Click "Clean" and confirm
4. Review the space freed

### 3. Optimize Performance
1. Go to the **Optimize** tab
2. Review startup programs and disable unnecessary ones
3. Run RAM optimization
4. Apply internet optimizations

### 4. Protect Your System
1. Go to the **Protect** tab
2. Run a vulnerability scan
3. Enable real-time protection
4. Review security recommendations

### 5. Schedule Regular Maintenance
1. Go to **Settings** > **Scan Settings**
2. Enable automatic scanning
3. Set your preferred schedule (daily/weekly/monthly)
4. Choose what to automatically clean

## System Requirements

### Minimum Requirements
- **OS:** Windows 10, macOS 10.15, Ubuntu 18.04, or equivalent
- **Processor:** 1.5 GHz dual-core
- **Memory:** 4 GB RAM
- **Storage:** 200 MB available space
- **Internet:** Required for updates and some features

### Recommended Requirements
- **OS:** Windows 11, macOS 12+, Ubuntu 22.04, or equivalent
- **Processor:** 2.0 GHz quad-core
- **Memory:** 8 GB RAM
- **Storage:** 500 MB available space
- **Internet:** Broadband connection

## Next Steps

- Read the [Feature Guide](./features.md) to learn about all capabilities
- Check [Troubleshooting](./troubleshooting.md) if you encounter issues
- Review [Security Best Practices](./security.md)

## Getting Help

- **Documentation:** Browse our full documentation
- **GitHub Issues:** Report bugs and request features
- **Community Forum:** Join discussions with other users
- **Email Support:** Contact us at support@osc-system-care.com

---

**Ready to optimize your system?** Open OSC System Care and click "Scan Now"!
