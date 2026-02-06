# OSC System Care - Frequently Asked Questions (FAQ)

Common questions about OSC System Care features, usage, and troubleshooting.

## Table of Contents
1. [General Questions](#general-questions)
2. [Installation & Setup](#installation--setup)
3. [Features & Usage](#features--usage)
4. [Safety & Security](#safety--security)
5. [Performance & System Impact](#performance--system-impact)
6. [Updates & Licensing](#updates--licensing)
7. [Platform-Specific Questions](#platform-specific-questions)
8. [Troubleshooting](#troubleshooting)

---

## General Questions

### Q: What is OSC System Care?
**A:** OSC System Care is an open-source system optimization tool that helps you clean, optimize, and protect your computer. It's a free alternative to commercial system utilities like Advanced SystemCare, offering features such as junk file cleaning, registry repair, startup management, and real-time protection.

### Q: Is OSC System Care really free?
**A:** Yes! OSC System Care is completely free and open-source under the MIT license. There are no hidden fees, subscription plans, or premium features locked behind paywalls. All features are available to all users.

### Q: Which operating systems are supported?
**A:** OSC System Care supports:
- Windows 10 and 11 (64-bit)
- macOS 10.15 (Catalina) and later
- Ubuntu 18.04+ and equivalent Linux distributions
- Fedora, Arch Linux, and other major distros

### Q: Is it safe to use?
**A:** Yes, OSC System Care is designed with safety as a top priority:
- Automatic backups before making changes
- System restore point creation (Windows)
- Undo functionality
- Protected file lists
- Preview before deletion
- No collection of personal data

### Q: How is it different from other system cleaners?
**A:** OSC System Care offers:
- **Open-source:** Transparent code, community-driven
- **Cross-platform:** Works on Windows, macOS, and Linux
- **Modern UI:** Built with React and Electron
- **Real-time protection:** Continuous monitoring
- **Behavioral analysis:** Advanced threat detection
- **Streaming scans:** Handles millions of files efficiently
- **No bloatware:** Clean, focused functionality

---

## Installation & Setup

### Q: How do I install OSC System Care?
**A:** See our [Getting Started Guide](./getting-started.md) for detailed instructions. Quick steps:
- **Windows:** Download and run the MSI installer
- **macOS:** Open DMG and drag to Applications
- **Linux:** Use AppImage, or install .deb/.rpm package

### Q: Do I need administrator privileges?
**A:** While OSC can run without admin rights, many features require elevated permissions:
- System-wide cleaning
- Registry modifications (Windows)
- Startup program management
- Some optimizations

**Recommendation:** Run as administrator for full functionality.

### Q: Can I install it on multiple computers?
**A:** Absolutely! Since it's open-source and free, you can install it on as many computers as you like - personal, work, family computers, etc.

### Q: Will it conflict with my antivirus?
**A:** OSC System Care is designed to work alongside antivirus software. However:
- Some antivirus may flag it initially (false positive)
- Add OSC to your antivirus whitelist if needed
- Real-time protection may briefly overlap with antivirus
- No conflicts reported with major antivirus products

### Q: How much disk space does it need?
**A:** OSC System Care requires approximately:
- **Installation:** 200 MB
- **Recommended:** 500 MB (for caches and backups)
- **Minimum free space:** 100 MB for operations

---

## Features & Usage

### Q: How often should I run scans?
**A:** Recommended frequency:
- **Quick Scan:** Daily or every few days
- **Full System Scan:** Weekly
- **Deep Clean:** Monthly
- **Automatic:** Enable scheduled scans in settings

**Tip:** Don't over-scan - running too frequently can impact performance.

### Q: What's the difference between Quick Scan and Full Scan?
**A:**
- **Quick Scan:** Fast (1-3 minutes), checks common junk locations, temporary files, browser caches
- **Full Scan:** Thorough (5-30 minutes), scans all drives, registry, deep system folders, large file finder

**Recommendation:** Use Quick Scan regularly, Full Scan monthly.

### Q: Can I schedule automatic cleaning?
**A:** Yes! Go to **Settings → Scan Settings** to:
- Enable automatic scanning
- Set scan frequency (daily/weekly/monthly)
- Choose preferred time
- Select auto-clean options
- Set maintenance reminders

### Q: What does the Health Score mean?
**A:** The Health Score (0-100) indicates your system's overall condition:
- **0-40 (Red):** Critical - Many issues found
- **41-70 (Yellow):** Warning - Some optimizations recommended
- **71-100 (Green):** Good - System is well-maintained

Score is based on junk files, registry errors, security issues, and performance metrics.

### Q: Can I undo changes made by OSC?
**A:** Yes! Multiple ways to undo:
1. **Dashboard → Recent Actions:** Click "Undo" on specific operations
2. **Settings → Backup:** Restore registry backups
3. **Windows:** Use System Restore points
4. **Recycle Bin/Trash:** Restore deleted files

**Note:** Always check what will be changed before confirming operations.

### Q: What files are safe to clean?
**A:** Generally safe to clean:
- Temporary files
- Browser caches and cookies
- Recycle Bin/Trash contents
- Old log files
- Application caches
- Download history

**Be careful with:**
- System files (OS protects these)
- Program data
- Personal documents
- Registry entries (use backup)

Always review the scan results before cleaning.

---

## Safety & Security

### Q: Will OSC delete my personal files?
**A:** No, OSC System Care is designed to avoid personal files:
- Only scans known system and cache locations
- Protected file lists prevent deletion of important files
- Preview shows what will be deleted
- Files go to Trash/Recycle Bin first (recoverable)

**Safety tip:** Always review the list before confirming cleaning.

### Q: Is my data collected or shared?
**A:** No, OSC System Care respects your privacy:
- No personal data collection
- No telemetry without explicit opt-in
- No internet connection required for core features
- All processing happens locally on your machine
- Open-source code you can audit

**Optional:** You can opt-in to share anonymous usage statistics to help improve the app.

### Q: Can it damage my system?
**A:** OSC includes multiple safeguards to prevent damage:
- Automatic backups before changes
- System restore points (Windows)
- Protected critical system files
- Undo capabilities
- Confirmation dialogs for risky operations

**Recommendation:** Enable automatic backups in settings.

### Q: Is it safe to clean the registry?
**A:** Registry cleaning is safe with precautions:
- Automatic backup created before changes
- Only removes invalid/orphaned entries
- Doesn't touch critical system keys
- Restore function available

**Note:** Registry cleaning is available on Windows only.

### Q: How does real-time protection work?
**A:** Real-time protection monitors:
- File system changes
- Process behavior
- Suspicious activities
- Unauthorized access attempts
- Known threat signatures

When threats are detected:
- Automatic quarantine
- User notification
- Detailed log entry
- Recommended actions

---

## Performance & System Impact

### Q: Will OSC slow down my computer?
**A:** OSC is designed for minimal impact:
- Runs scans in background with low priority
- Uses worker threads efficiently
- Adaptive polling reduces CPU usage when idle
- Lightweight UI (React-based)
- Can be paused or scheduled for off-hours

**During scans:** You may notice slight slowdown (5-10% CPU usage).

### Q: How much RAM does OSC use?
**A:** Typical resource usage:
- **Idle:** 50-100 MB RAM
- **Scanning:** 100-300 MB RAM
- **Optimization:** 150-400 MB RAM

This is comparable to other system utilities and shouldn't impact normal usage.

### Q: Can I use my computer while scanning?
**A:** Yes! Scans run in the background:
- Continue working normally
- Scans may slow slightly if system is busy
- Pause scan if you need maximum performance
- Scheduled scans run when computer is idle

### Q: Why is my first scan taking so long?
**A:** First scans take longer because:
- Initial baseline establishment
- Full system inventory
- No cached data yet
- May find more junk files

Subsequent scans are typically 50-70% faster.

### Q: Will cleaning actually improve performance?
**A:** Yes, cleaning can improve performance by:
- Freeing up disk space (better disk performance)
- Removing unnecessary startup programs (faster boot)
- Clearing memory (more RAM available)
- Fixing registry errors (Windows)
- Removing bloatware

**Typical improvements:**
- 10-30% faster boot times
- 5-15% more available RAM
- 1-10 GB disk space freed
- Smoother overall performance

---

## Updates & Licensing

### Q: How do I update OSC System Care?
**A:** Multiple update methods:
1. **Automatic:** Check for updates automatically (Settings → General)
2. **Manual:** Help → Check for Updates
3. **Download:** Get latest version from releases page
4. **Auto-update:** Updates install automatically when available

### Q: Are updates free?
**A:** Yes! All updates are free forever. Since OSC is open-source:
- No subscription fees
- No paid upgrades
- All features included
- Community-driven development

### Q: How often are updates released?
**A:** Update schedule:
- **Bug fixes:** As needed (weekly/bi-weekly)
- **Feature updates:** Monthly
- **Major releases:** Quarterly
- **Security updates:** Immediately when discovered

Enable automatic updates to stay current.

### Q: What license is OSC released under?
**A:** OSC System Care is released under the **MIT License**:
- Free for personal use
- Free for commercial use
- Can modify and distribute
- Must include license and copyright
- No warranty provided

See LICENSE file for full details.

### Q: Can I contribute to development?
**A:** Absolutely! OSC welcomes contributions:
- **Code:** Submit pull requests on GitHub
- **Documentation:** Improve docs and guides
- **Testing:** Report bugs and test features
- **Translations:** Help localize for other languages
- **Design:** UI/UX improvements

Check GitHub repository for contribution guidelines.

---

## Platform-Specific Questions

### Windows

### Q: Do I need to disable Windows Defender?
**A:** No, keep Windows Defender enabled. OSC works alongside it:
- Add OSC folder to exclusions if needed
- No conflicts with real-time protection
- Complements Windows security

### Q: Will it work with Windows 11?
**A:** Yes! Fully compatible with Windows 11:
- All features work on Windows 11
- Optimized for new UI
- Supports Windows 11-specific features
- Regularly tested on Windows 11

### Q: Can I use it on Windows 7 or 8?
**A:** No, OSC requires Windows 10 or later:
- Windows 7/8 reached end-of-life
- Security concerns with older OS
- Modern features require Windows 10+
- Recommendation: Upgrade to Windows 10/11

### macOS

### Q: Why does it need Full Disk Access?
**A:** Full Disk Access is required for:
- Scanning system folders
- Cleaning caches
- Managing startup items
- Accessing application data

Without it, OSC cannot perform most functions.

### Q: Will it work on Apple Silicon (M1/M2/M3)?
**A:** Yes! OSC supports Apple Silicon Macs:
- Native ARM64 support
- Optimized for Apple Silicon
- Tested on M1, M2, and M3 chips
- Intel Macs also supported

### Q: Can it clean Time Machine backups?
**A:** No, and you shouldn't:
- Time Machine manages its own cleanup
- Manual deletion can corrupt backups
- Use Time Machine preferences to manage space
- OSC can exclude Time Machine from scans

### Linux

### Q: Which Linux distributions are supported?
**A:** OSC supports major distributions:
- Ubuntu 18.04+ and derivatives (Mint, Pop!_OS)
- Fedora 30+
- Debian 10+
- Arch Linux and Manjaro
- openSUSE
- Any distribution with system libraries

### Q: Do I need to use sudo?
**A:** Some features require sudo:
- System-wide cleaning
- Package manager integration
- Service management
- User can run most features without sudo

**Recommendation:** Use sudo for full functionality.

### Q: Will it work with my package manager?
**A:** Yes! OSC integrates with:
- apt (Debian/Ubuntu)
- dnf/yum (Fedora/RHEL)
- pacman (Arch)
- snap
- flatpak

Can uninstall packages from all major managers.

---

## Troubleshooting

### Q: The app won't start, what should I do?
**A:** Try these steps:
1. Restart your computer
2. Run as administrator/root
3. Clear app data (see below)
4. Reinstall OSC
5. Check system requirements

**Clear app data:**
- Windows: Delete `%APPDATA%\OSC System Care`
- macOS: Delete `~/Library/Application Support/OSC System Care`
- Linux: Delete `~/.config/osc-system-care`

See [Troubleshooting Guide](./troubleshooting.md) for more solutions.

### Q: Scan never completes, why?
**A:** Possible causes:
- Large drives (TB+ size)
- Network drives
- Locked or corrupted files
- Too many files to scan

**Solutions:**
- Exclude problematic folders
- Scan drives individually
- Run during off-hours
- Check for disk errors

### Q: I accidentally deleted important files, help!
**A:** Recovery options:
1. Check Recycle Bin/Trash first
2. Use OSC's Undo feature (Recent Actions)
3. Restore from backup
4. Use file recovery software (Recuva, PhotoRec)

**Prevention:**
- Always review before cleaning
- Enable backup feature
- Don't clean unfamiliar items

### Q: How do I report a bug?
**A:** Report bugs via:
1. **In-app:** Help → Report a Bug
2. **GitHub:** Create issue on repository
3. **Email:** support@osc-system-care.com

**Include:**
- OSC version
- OS version
- Steps to reproduce
- Error messages
- Log files

### Q: Where can I get more help?
**A:** Support resources:
- [Getting Started Guide](./getting-started.md)
- [Feature Guide](./features.md)
- [Troubleshooting Guide](./troubleshooting.md)
- GitHub Issues
- Community discussions
- Email support

---

## Quick Tips

### Best Practices
- ✅ Run scans weekly
- ✅ Review results before cleaning
- ✅ Enable automatic backups
- ✅ Keep OSC updated
- ✅ Use scheduling for maintenance
- ✅ Monitor health score trends

### What NOT to Do
- ❌ Don't clean without reviewing
- ❌ Don't disable all startup items
- ❌ Don't scan too frequently (daily is enough)
- ❌ Don't ignore security warnings
- ❌ Don't delete unfamiliar files

### Keyboard Shortcuts
- `Ctrl/Cmd + Shift + S`: Quick Scan
- `Ctrl/Cmd + Shift + C`: Quick Clean
- `Ctrl/Cmd + Shift + O`: Optimize RAM
- `Ctrl/Cmd + ,`: Settings
- `Ctrl/Cmd + 1-6`: Switch modules

---

## Still Have Questions?

- 📖 Browse our [documentation](./)
- 🐛 Report issues on [GitHub](https://github.com/yourusername/osc-system-care/issues)
- 💬 Join [community discussions](https://github.com/yourusername/osc-system-care/discussions)
- 📧 Email: support@osc-system-care.com

**Happy optimizing!** 🚀
