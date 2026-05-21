# Update Server Configuration Guide

This guide explains how to configure automatic updates for OSC System Care using GitHub Releases.

## Overview

OSC System Care uses `electron-updater` to automatically check for and download updates. The application is configured to use **GitHub Releases** as the update server, which is:

- ✅ Free for open source projects
- ✅ Reliable and globally distributed
- ✅ Easy to set up
- ✅ Integrated with your development workflow

## Configuration

### 1. GitHub Repository Setup

Ensure your repository is properly configured:

1. **Repository must be public** (for free GitHub Releases)
2. **Repository name** should match the configuration in `package.json`:

   ```json
   {
     "publish": {
       "provider": "github",
       "owner": "yourusername",
       "repo": "osc-system-care"
     }
   }
   ```

3. **Update the owner and repo** in `package.json` to match your GitHub username and repository name

### 2. GitHub Token (For Automated Publishing)

To publish releases automatically from CI/CD, you need a GitHub token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - Or for public repos: `public_repo` access
4. Copy the token

#### Setting up the Token

**For GitHub Actions (Recommended):**

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `GH_TOKEN`
5. Value: Your personal access token
6. Click "Add secret"

**For Local Publishing:**

Set environment variable:

```bash
# Linux/macOS
export GH_TOKEN=your_token_here

# Windows (PowerShell)
$env:GH_TOKEN="your_token_here"

# Windows (CMD)
set GH_TOKEN=your_token_here
```

### 3. Update Check Configuration

The application automatically checks for updates on startup. You can configure this behavior:

**In your application code** (electron/main.ts):

```typescript
import { autoUpdater } from "electron-updater";

// Configure update checking
autoUpdater.checkForUpdatesAndNotify();

// Or for more control:
autoUpdater.checkForUpdates();

// Listen for update events
autoUpdater.on("update-available", () => {
  console.log("Update available");
});

autoUpdater.on("update-downloaded", () => {
  console.log("Update downloaded");
  // Optionally auto-restart
  autoUpdater.quitAndInstall();
});
```

**Configuration options in package.json:**

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "yourusername",
      "repo": "osc-system-care",
      "releaseType": "release",
      "publishAutoUpdate": true
    }
  }
}
```

## Publishing Updates

### Manual Publishing

1. **Update version** in `package.json`:

   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Build the application**:

   ```bash
   npm run build:all
   ```

3. **Publish to GitHub**:
   ```bash
   npm run publish
   ```
   Or:
   ```bash
   electron-builder --publish always
   ```

### Automated Publishing (CI/CD)

The CI/CD pipeline is already configured in `.github/workflows/ci-cd.yml`. It will automatically:

1. Build on every push to main
2. Create a release when you push a tag
3. Publish update files to GitHub Releases

**To create a release:**

```bash
# Update version
npm version patch  # or minor, major

# Push tags
git push origin main --tags
```

The GitHub Actions workflow will:

- Build for Windows, macOS, and Linux
- Create a GitHub Release
- Upload installer files
- Upload auto-update metadata files (latest.yml, latest-mac.yml, etc.)

## Update File Structure

GitHub Releases will contain:

```
Release: v1.0.0
├── OSC-System-Care-1.0.0-win-x64.exe (NSIS installer)
├── OSC-System-Care-1.0.0-win-x64.msi (MSI installer)
├── OSC-System-Care-1.0.0-win-portable.exe (Portable)
├── OSC-System-Care-1.0.0-mac-x64.dmg (macOS DMG)
├── OSC-System-Care-1.0.0-mac-arm64.dmg (Apple Silicon)
├── OSC-System-Care-1.0.0-linux-x86_64.AppImage (Linux AppImage)
├── latest.yml (Windows update info)
├── latest-mac.yml (macOS update info)
└── latest-linux.yml (Linux update info)
```

## How Updates Work

### Update Process

1. **Check:** App checks GitHub Releases on startup (or when manually triggered)
2. **Compare:** Compares current version with latest release
3. **Download:** If newer version exists, downloads in background
4. **Notify:** Shows notification when update is ready
5. **Install:** User clicks to restart and install update

### Update Metadata Files

electron-builder generates YAML files with update information:

**latest.yml (Windows):**

```yaml
version: 1.0.1
releaseDate: "2026-02-06T12:00:00.000Z"
path: OSC-System-Care-1.0.1-win-x64.exe
sha512: abc123... (hash)
```

The app downloads this file to check for updates and verify file integrity.

## Alternative Update Servers

If you prefer not to use GitHub Releases, you can use:

### Generic HTTP Server

1. **Set up a web server** (AWS S3, DigitalOcean Spaces, etc.)
2. **Update package.json**:
   ```json
   {
     "publish": {
       "provider": "generic",
       "url": "https://your-server.com/updates"
     }
   }
   ```
3. **Upload files** to the server after building

### S3-Compatible Storage

```json
{
  "publish": {
    "provider": "s3",
    "bucket": "your-bucket-name",
    "region": "us-east-1",
    "path": "/updates"
  }
}
```

### Bintray (Deprecated)

Note: JFrog Bintray was shut down in 2021. Use GitHub or S3 instead.

## Troubleshooting

### "Cannot find latest.yml"

**Cause:** The update metadata file wasn't uploaded to the release

**Solution:**

- Ensure `publishAutoUpdate: true` is set
- Check that CI/CD uploaded all files
- Manually upload `latest.yml` if needed

### "Update check failed"

**Cause:** Network issues or incorrect configuration

**Solution:**

- Check internet connection
- Verify GitHub repository is accessible
- Check browser console for detailed errors
- Ensure `owner` and `repo` are correct in package.json

### "Signature verification failed"

**Cause:** Code signing certificate issue (Windows/macOS)

**Solution:**

- For Windows: Configure code signing certificate
- For macOS: Notarize the app
- Or disable signature verification (not recommended for production):
  ```json
  {
    "win": {
      "verifyUpdateCodeSignature": false
    }
  }
  ```

### Updates not downloading

**Cause:** GitHub API rate limits or network issues

**Solution:**

- Check GitHub status
- Add delay between update checks
- Implement retry logic

## Security Considerations

### Code Signing

**Windows:**

- Purchase code signing certificate
- Configure in package.json:
  ```json
  {
    "win": {
      "certificateFile": "certificate.p12",
      "certificatePassword": "password"
    }
  }
  ```

**macOS:**

- Requires Apple Developer account
- App must be notarized
- Configure in package.json:
  ```json
  {
    "mac": {
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist"
    }
  }
  ```

### Update Verification

Always verify:

1. ✅ HTTPS URLs (never HTTP)
2. ✅ Checksum verification (SHA-512)
3. ✅ Signature verification (when code signed)
4. ✅ Download from trusted source only

## Testing Updates

### Test Update Flow Locally

1. **Build current version:**

   ```bash
   npm version 1.0.0
   npm run build:all
   ```

2. **Install the app**

3. **Make a small change**

4. **Build new version:**

   ```bash
   npm version 1.0.1
   npm run build:all
   ```

5. **Publish to test channel:**

   ```bash
   electron-builder --publish always --config.publish.releaseType=prerelease
   ```

6. **Test update:**
   - Open installed app
   - Check for updates
   - Verify it downloads and installs

### Pre-release Testing

Use GitHub pre-releases for beta testing:

```bash
# Create beta version
npm version 1.0.0-beta.1

# Publish as pre-release
electron-builder --publish always --config.publish.releaseType=prerelease
```

Users can opt-in to beta updates in settings.

## Best Practices

### Version Numbering

Follow Semantic Versioning (SemVer):

- **MAJOR:** Breaking changes
- **MINOR:** New features, backwards compatible
- **PATCH:** Bug fixes

Examples:

- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

### Release Notes

Always include release notes:

1. Go to GitHub Releases
2. Edit the release
3. Add description:

   ```markdown
   ## What's New

   - Feature A
   - Feature B

   ## Bug Fixes

   - Fixed issue #123

   ## Security

   - Updated dependencies
   ```

### Update Frequency

- **Don't release too often:** Users get annoyed by frequent updates
- **Batch fixes:** Group bug fixes into single release
- **Test thoroughly:** Ensure updates work before releasing
- **Gradual rollout:** Use pre-releases for testing

## Cost Analysis

### GitHub Releases (Recommended)

- ✅ **Free** for public repositories
- ✅ No bandwidth limits
- ✅ Integrated with GitHub
- ✅ Version control integration

### AWS S3 (Alternative)

- 💰 ~$0.09/GB for storage
- 💰 ~$0.09/GB for bandwidth
- Example: 100MB app × 1000 downloads = ~$9/month

### Self-hosted Server

- 💰 Server costs: $5-50/month
- 💰 Bandwidth costs vary
- ✅ Full control
- ⚠️ Maintenance required

## Migration from Other Update Systems

If migrating from another update system:

1. **Ensure all users are on compatible version**
2. **Update the configuration** in package.json
3. **Test update flow thoroughly**
4. **Release migration update** with new configuration
5. **Monitor for issues**

## Next Steps

1. ✅ Update `package.json` with your GitHub username
2. ✅ Create GitHub Personal Access Token
3. ✅ Add token to repository secrets
4. ✅ Test publishing with `npm run publish`
5. ✅ Verify GitHub Release is created
6. ✅ Test update flow
7. ✅ Document release process for your team

## Support

- **electron-updater docs:** https://www.electron.build/auto-update
- **GitHub Releases docs:** https://docs.github.com/en/repositories/releasing-projects-on-github
- **Issue reporting:** GitHub Issues

---

**Ready to release?** Update the owner/repo in package.json and push your first release! 🚀
