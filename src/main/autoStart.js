// autoStart.js

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function enableAutoStart() {
  const appPath = app.getPath('exe');
  const appName = path.basename(appPath);
  const startupFolder = getStartupFolder();
  
  if (!startupFolder) return false;

  const shortcutPath = path.join(startupFolder, 'ZenSlice.lnk');
  
  try {
    // Create Windows shortcut using PowerShell
    const { execSync } = require('child_process');
    const powershellCommand = `
      $ws = New-Object -ComObject WScript.Shell;
      $s = $ws.CreateShortcut('${shortcutPath}');
      $s.TargetPath = '${appPath}';
      $s.Arguments = '--minimized';
      $s.WorkingDirectory = '${path.dirname(appPath)}';
      $s.WindowStyle = 7;
      $s.Save()
    `;
    
    execSync(`powershell -command "${powershellCommand}"`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.error('Failed to create startup shortcut:', e);
    return false;
  }
}

function disableAutoStart() {
  const startupFolder = getStartupFolder();
  if (!startupFolder) return false;

  const shortcutPath = path.join(startupFolder, 'ZenSlice.lnk');
  
  try {
    if (fs.existsSync(shortcutPath)) {
      fs.unlinkSync(shortcutPath);
    }
    return true;
  } catch (e) {
    console.error('Failed to remove startup shortcut:', e);
    return false;
  }
}

function getStartupFolder() {
  if (process.platform !== 'win32') return null;
  
  return path.join(
    app.getPath('appData'),
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup'
  );
}

module.exports = {
  enableAutoStart,
  disableAutoStart,
  getStartupFolder
};