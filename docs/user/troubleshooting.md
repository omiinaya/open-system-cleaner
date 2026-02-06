# OSC System Care - Troubleshooting Guide

Solutions to common issues and problems you might encounter while using OSC System Care.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Application Won't Start](#application-wont-start)
3. [Performance Issues](#performance-issues)
4. [Scanning Problems](#scanning-problems)
5. [Cleaning Issues](#cleaning-issues)
6. [Update Problems](#update-problems)
7. [Permission Errors](#permission-errors)
8. [Platform-Specific Issues](#platform-specific-issues)
9. [Error Codes](#error-codes)
10. [Getting Additional Help](#getting-additional-help)

---

## Installation Issues

### Issue: Installation Fails or Freezes

**Symptoms:**
- Installer stops responding
- Error during installation
- Installation rolls back

**Solutions:**

1. **Run as Administrator (Windows)**
   - Right-click installer → "Run as administrator"
   - Try installation again

2. **Check Disk Space**
   - Ensure you have at least 500 MB free space
   - Clean temporary files if needed

3. **Disable Antivirus Temporarily**
   - Some antivirus software may block installation
   - Disable real-time protection during install
   - Re-enable after installation completes

4. **Clear Temp Files**
   ```
   Windows: Delete contents of %temp% folder
   macOS: Delete contents of /tmp folder
   Linux: sudo rm -rf /tmp/*
   ```

5. **Download Fresh Copy**
   - Delete the downloaded installer
   - Re-download from official source
   - Verify file integrity (check checksums)

### Issue: Missing Dependencies

**Symptoms:**
- "DLL not found" errors (Windows)
- Library dependency errors (Linux)
- Framework installation prompts

**Solutions:**

**Windows:**
1. Install Visual C++ Redistributables:
   - Download from Microsoft website
   - Install both x86 and x64 versions
   - Restart computer

2. Install .NET Framework (if prompted)

**macOS:**
- Usually no additional dependencies needed
- If issues persist, update macOS to latest version

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install -f

# Fedora/RHEL
sudo dnf install <missing-package>

# Arch Linux
sudo pacman -S <missing-package>
```

---

## Application Won't Start

### Issue: App Crashes on Launch

**Symptoms:**
- Splash screen appears then closes
- Error dialog on startup
- Blank window

**Solutions:**

1. **Check System Requirements**
   - Verify minimum requirements met
   - Check available RAM (need 4 GB minimum)
   - Check disk space

2. **Clear App Data**
   ```
   Windows: %APPDATA%\OSC System Care
   macOS: ~/Library/Application Support/OSC System Care
   Linux: ~/.config/osc-system-care
   ```
   - Rename or delete this folder
   - App will recreate on next launch
   - Note: You'll lose settings

3. **Check Graphics Drivers**
   - Update graphics drivers to latest version
   - Restart computer after update

4. **Run in Safe Mode**
   - Hold Shift while launching (Windows)
   - Launch from terminal with `--safe-mode` flag

5. **Check Logs**
   - Logs location in settings folder (see above)
   - Look for error messages
   - Include in support request

### Issue: App Hangs or Freezes

**Symptoms:**
- Application becomes unresponsive
- Spinning cursor
- "Not Responding" in title bar

**Solutions:**

1. **Wait It Out**
   - First scan or optimization may take time
   - Large drives can take 10-30 minutes
   - Check progress indicator

2. **Reduce Scan Scope**
   - Cancel current operation (Esc or Cancel button)
   - Select fewer drives/folders to scan
   - Try scanning one drive at a time

3. **Close Other Applications**
   - Free up system resources
   - Close memory-heavy programs
   - Try again

4. **Restart Application**
   - Force quit if necessary (Ctrl+Alt+Del / Cmd+Option+Esc)
   - Relaunch application

5. **Check for Conflicts**
   - Temporarily disable other system utilities
   - Close antivirus software
   - Try again

---

## Performance Issues

### Issue: System Slower After Using OSC

**Symptoms:**
- Computer slower than before
- High CPU usage
- Applications taking longer to load

**Solutions:**

1. **Restart Your Computer**
   - Some optimizations require restart
   - Clears temporary states

2. **Check What Was Disabled**
   - Open Startup Manager
   - Review disabled items
   - Re-enable critical services

3. **Restore Registry (Windows)**
   - Open OSC System Care
   - Go to Settings → Backup
   - Restore most recent backup

4. **Undo Changes**
   - Many operations have "Undo" option
   - Check Recent Actions
   - Undo recent changes

5. **Check Background Processes**
   - Open Task Manager / Activity Monitor
   - Look for OSC System Care processes
   - Ensure not running multiple instances

### Issue: High CPU/Memory Usage by OSC

**Symptoms:**
- OSC using excessive resources
- System sluggish during scans
- Fan running constantly

**Solutions:**

1. **Lower Scan Priority**
   - Settings → Advanced → Worker Threads
   - Reduce number of threads
   - Set lower process priority

2. **Schedule Scans for Off-Hours**
   - Settings → Scan Settings
   - Set scans for when computer is idle
   - Avoid peak usage times

3. **Reduce Scan Frequency**
   - Don't run scans too frequently
   - Weekly scans are usually sufficient
   - Cancel unnecessary scans

4. **Check for Large Files**
   - Some files take longer to scan
   - Add to exclusion list if safe
   - Consider breaking large archives

5. **Update to Latest Version**
   - Performance improvements in updates
   - Bug fixes for resource usage
   - Check for updates

---

## Scanning Problems

### Issue: Scan Never Completes

**Symptoms:**
- Scan stuck at certain percentage
- No progress for long time
- Scan runs indefinitely

**Solutions:**

1. **Check for Problem Files**
   - Note where scan stops
   - That file/folder may be locked
   - Add to exclusion list

2. **Scan Specific Locations**
   - Instead of full scan, select specific drives
   - Exclude problematic folders
   - Scan in smaller chunks

3. **Check File Permissions**
   - Run OSC as administrator
   - Some folders require elevated access
   - Grant necessary permissions

4. **Disable Real-Time Protection Temporarily**
   - Antivirus may interfere
   - Pause during scan
   - Re-enable after

5. **Restart and Try Again**
   - Clear file locks
   - Reset system state
   - Fresh scan attempt

### Issue: False Positives

**Symptoms:**
- Important files flagged as junk
- Legitimate programs marked as threats
- Clean items shown as issues

**Solutions:**

1. **Review Before Cleaning**
   - Always check scan results
   - Deselect legitimate items
   - Use "Restore" if mistake made

2. **Add to Whitelist**
   - Settings → Privacy/Scan Settings
   - Add file/folder to exclusions
   - Won't be flagged again

3. **Report False Positive**
   - Help improve detection
   - Submit through feedback
   - Include file details

4. **Lower Sensitivity**
   - Settings → Scan Settings
   - Reduce sensitivity level
   - Less aggressive scanning

---

## Cleaning Issues

### Issue: Cannot Delete Certain Files

**Symptoms:**
- "Access Denied" errors
- Files remain after cleaning
- Permission errors

**Solutions:**

1. **Run as Administrator**
   - Close OSC
   - Right-click → "Run as administrator"
   - Try cleaning again

2. **Check File Locks**
   - File may be in use by another program
   - Close other applications
   - Restart computer and try

3. **Check File Permissions**
   - File may be read-only
   - Change file permissions
   - Take ownership (advanced)

4. **Use File Shredder**
   - For stubborn files
   - Use secure deletion method
   - Forces deletion

5. **Manual Deletion**
   - Note file path from error
   - Navigate to location manually
   - Delete using file manager
   - Empty trash/recycle bin

### Issue: System Unstable After Cleaning

**Symptoms:**
- Programs won't start
- System errors
- Missing functionality

**Solutions:**

1. **Restore Registry (Windows)**
   - OSC makes automatic backups
   - Settings → Backup → Restore
   - Select backup from before cleaning

2. **System Restore (Windows)**
   - Windows System Restore
   - Restore to earlier point
   - Should fix most issues

3. **Undo in OSC**
   - Dashboard → Recent Actions
   - Find cleaning operation
   - Click "Undo"

4. **Reinstall Affected Software**
   - Some programs may need reinstall
   - Use original installers
   - Restore functionality

5. **Check Recycle Bin**
   - Files moved to trash, not deleted
   - Restore accidentally deleted files
   - Empty trash after verification

---

## Update Problems

### Issue: Update Fails to Download

**Symptoms:**
- "Download failed" message
- Update stuck at 0%
- Network error during update

**Solutions:**

1. **Check Internet Connection**
   - Verify network is working
   - Try loading website
   - Check firewall settings

2. **Disable VPN/Proxy**
   - VPNs may block downloads
   - Disable temporarily
   - Try update again

3. **Manual Download**
   - Download from releases page
   - Install manually
   - Updates will resume normally

4. **Check Disk Space**
   - Need space for download
   - Temporary files during install
   - Free up space if needed

5. **Try Again Later**
   - Server may be temporarily down
   - High traffic periods
   - Try off-peak hours

### Issue: Update Installed but Version Unchanged

**Symptoms:**
- Still shows old version number
- New features not available
- Update keeps prompting

**Solutions:**

1. **Restart Application**
   - Updates often require restart
   - Close and reopen OSC
   - Check version number

2. **Check Multiple Instances**
   - Old version may still be running
   - Check system tray
   - Quit all instances

3. **Manual Installation**
   - Download installer directly
   - Run setup
   - Overwrites existing version

4. **Clear Update Cache**
   ```
   Delete update files in:
   Windows: %LOCALAPPDATA%\osc-system-care-updater
   macOS: ~/Library/Caches/OSC System Care
   Linux: ~/.cache/osc-system-care
   ```

---

## Permission Errors

### Issue: "Access Denied" or Permission Errors

**Symptoms:**
- Cannot scan certain folders
- Cannot clean protected files
- UAC prompts repeatedly

**Solutions:**

**Windows:**

1. **Run as Administrator**
   - Right-click OSC icon
   - Select "Run as administrator"
   - Grants full system access

2. **Adjust UAC Settings**
   - Control Panel → User Accounts
   - Change User Account Control settings
   - Don't set to "Never notify"

3. **Check Folder Permissions**
   - Right-click folder → Properties
   - Security tab
   - Ensure read/write access

**macOS:**

1. **Grant Full Disk Access**
   - System Preferences → Security & Privacy
   - Privacy tab → Full Disk Access
   - Add OSC System Care
   - Restart application

2. **Terminal Permission Fix**
   ```bash
   sudo tccutil reset All com.osc.systemcare
   ```

**Linux:**

1. **Run with sudo**
   ```bash
   sudo osc-system-care
   ```

2. **Add User to Groups**
   ```bash
   sudo usermod -aG disk $USER
   sudo usermod -aG adm $USER
   ```
   - Log out and back in

---

## Platform-Specific Issues

### Windows-Specific

**Issue: Windows Defender Blocks OSC**

**Solution:**
1. Windows Security → Virus & threat protection
2. Virus & threat protection settings → Manage settings
3. Add or remove exclusions
4. Add OSC installation folder

**Issue: SmartScreen Warning**

**Solution:**
1. Click "More info" on warning
2. Click "Run anyway"
3. Or right-click installer → Properties
4. Check "Unblock" at bottom

**Issue: .NET Framework Errors**

**Solution:**
1. Download .NET 6.0 Runtime
2. Install and restart
3. Try launching OSC again

### macOS-Specific

**Issue: "App is damaged" Warning**

**Solution:**
1. System Preferences → Security & Privacy
2. Click "Open Anyway"
3. Or use terminal:
   ```bash
   xattr -cr /Applications/OSC\ System\ Care.app
   ```

**Issue: Cannot Find Apps to Uninstall**

**Solution:**
1. Grant Full Disk Access (see above)
2. Check Applications folder permissions
3. Try running with elevated permissions

**Issue: Time Machine Issues**

**Solution:**
1. Exclude OSC from Time Machine
2. Settings → Privacy → Time Machine
3. Or add to exclusions in Time Machine preferences

### Linux-Specific

**Issue: Package Manager Errors**

**Solution:**
```bash
# Fix broken packages
sudo apt-get --fix-broken install  # Debian/Ubuntu
sudo dnf fix                       # Fedora
sudo pacman -Syu                   # Arch
```

**Issue: AppImage Won't Run**

**Solution:**
```bash
chmod +x OSC-System-Care-*.AppImage
./OSC-System-Care-*.AppImage
```

**Issue: Missing Libraries**

**Solution:**
```bash
# Check dependencies
ldd /usr/bin/osc-system-care
# Install missing libraries
sudo apt-get install libgtk-3-0 libnotify4 libnss3
```

---

## Error Codes

### Common Error Codes and Solutions

**Error 1001: Scan Timeout**
- **Cause:** Scan taking too long
- **Solution:** Reduce scan scope, increase timeout in settings

**Error 1002: Permission Denied**
- **Cause:** Insufficient privileges
- **Solution:** Run as administrator/root

**Error 1003: File In Use**
- **Cause:** File locked by another process
- **Solution:** Close other applications, restart

**Error 1004: Disk Full**
- **Cause:** No space for operations
- **Solution:** Free up disk space

**Error 1005: Network Error**
- **Cause:** Cannot reach update server
- **Solution:** Check internet, firewall, proxy settings

**Error 1006: Backup Failed**
- **Cause:** Cannot create backup
- **Solution:** Check backup location permissions, disk space

**Error 1007: Registry Error (Windows)**
- **Cause:** Cannot access/modify registry
- **Solution:** Run as administrator, check antivirus

**Error 1008: Update Failed**
- **Cause:** Update download or install failed
- **Solution:** Manual download, check permissions

**Error 1009: Database Error**
- **Cause:** Internal database corruption
- **Solution:** Clear app data, reinstall

**Error 1010: Worker Thread Error**
- **Cause:** Multi-threading issue
- **Solution:** Reduce worker threads in settings

---

## Getting Additional Help

If issues persist after trying these solutions:

### 1. Check Documentation
- [Getting Started Guide](./getting-started.md)
- [Feature Guide](./features.md)
- [FAQ](./faq.md)

### 2. Collect Information
Before contacting support, gather:
- OSC version number (Help → About)
- Operating system and version
- Error messages (screenshots)
- Log files (Settings → Advanced → Open Log Folder)
- Steps to reproduce the issue

### 3. Community Support
- **GitHub Issues:** github.com/yourusername/osc-system-care/issues
- **Discussions:** GitHub Discussions forum
- **Community Forum:** [Link to community forum]

### 4. Contact Support
- **Email:** support@osc-system-care.com
- **Response Time:** 24-48 hours
- **Include:** All information collected above

### 5. Report Bug
Use the in-app feedback:
1. Help → Report a Bug
2. Fill out the form
3. Include logs
4. Submit

---

## Quick Fixes Checklist

Before contacting support, try these quick fixes:

- [ ] Restart OSC System Care
- [ ] Restart your computer
- [ ] Run as administrator/root
- [ ] Update to latest version
- [ ] Clear app data/cache
- [ ] Check disk space
- [ ] Disable antivirus temporarily
- [ ] Check internet connection
- [ ] Reinstall OSC System Care
- [ ] Check system requirements

---

**Still having issues?** We're here to help! Contact support with your error details.
