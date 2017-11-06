import { app, BrowserWindow, dialog } from 'electron'; // eslint-disable-line
import { autoUpdater } from 'electron-updater';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path') // eslint-disable-line
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\'); // eslint-disable-line
}

let mainWindow;
let updateWindow;

const winURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
  });

  mainWindow.loadURL(winURL);

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

// Custom Installer Looped function
let downloadFinished = false;
let pendingDownload = false;

const sendStatusToWindow = text => {
  if (mainWindow) mainWindow.webContents.send('message', text);
};

function downloadAndUpdateApp() {
  if (!updateWindow) {
    updateWindow = new BrowserWindow({
      height: 200,
      useContentSize: true,
      width: 500,
    });

    updateWindow.loadURL(
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:9080#/utils/update-loading-view'
        : `file://${__dirname}/index.html#/utils/update-loading-view`,
    );

    updateWindow.on('closed', () => {
      updateWindow = null;
    });
    updateWindow.once('ready-to-show', () => {
      updateWindow.show();
    });
  }
  if (downloadFinished) {
    // show loading window
    autoUpdater.quitAndInstall();
    app.quit();
  } else setTimeout(downloadAndUpdateApp, 500);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', () => {
  sendStatusToWindow('Update available.');
  dialog.showMessageBox(
    {
      title: 'Update Available',
      message:
        'A new Version of FrenteVentures Application is available, download and install now?',
      defaultId: 0,
      buttons: ['Download and Install', 'Install on Quit'],
    },
    buttonIndex => {
      if (buttonIndex === 0) downloadAndUpdateApp();
      else pendingDownload = true;
    },
  );
});

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', err => {
  sendStatusToWindow(`Error in auto-updater: ${err.toString()}`);
});

autoUpdater.on('download-progress', progressObj => {
  sendStatusToWindow(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`,
  );
  if (updateWindow) {
    updateWindow.webContents.send('progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('Update downloaded; will install now');
  downloadFinished = true;
});

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates();
});

app.on('will-quit', () => {
  if (pendingDownload) {
    event.preventDefault();
    downloadAndUpdateApp();
  }
});
