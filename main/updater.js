const {
  BrowserWindow, dialog, ipcMain, app,
} = require("electron");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater");
const { showProgressWindow } = require("./updaterCheck");

ipcMain.on("installUpdate", event => {
  autoUpdater.quitAndInstall();
});

// UPDATER
autoUpdater.allowPrerelease = isDev;
autoUpdater.autoDownload = false;

const cancelUpdater = () => {
  const { progressWindow } = global.windows;
  global.updater.cancellationToken.cancel();
  progressWindow.hide();
};

const checkForUpdates = async () => {
  const checking = await autoUpdater.checkForUpdates();
  const { cancellationToken } = checking;

  global.updater = {
    cancellationToken,
    onStartup: false,
  };
};

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
});

autoUpdater.on("update-available", info => {
  const { cancellationToken } = global.updater;
  let currentVersion;

  if (isDev) {
    currentVersion = process.env.npm_package_version;
  } else {
    currentVersion = app.getVersion();
  }

  const options = {
    title: "Software Update",
    type: "info",
    message: "A new version of Caption is available!",
    detail: `Caption ${info.version} is now available — you have v${currentVersion}. Would you like to download it now?`,
    buttons: ["Install Update", "Remind Me Later"],
    defaultId: 0,
  };

  dialog.showMessageBox(null, options, response => {
    if (response === 0) {
      showProgressWindow();
      autoUpdater.downloadUpdate(cancellationToken);
    }
  });
});

autoUpdater.on("update-not-available", info => {
  console.log(`Update not available. ${info}`);

  if (!global.updater.onStartup) {
    const options = {
      type: "info",
      message: "Caption is up to date",
      detail: "It looks like you're already rocking the latest version!",
    };

    dialog.showMessageBox(null, options);
  }
});

autoUpdater.on("error", (event, error) => {
  console.log(error);
});

autoUpdater.on("download-progress", progressObj => {
  const { progressWindow } = global.windows;
  progressWindow.webContents.send("progress", progressObj);
});

autoUpdater.on("update-downloaded", info => {
  console.log(`Update downloaded; will install in 5 seconds. ${info}`);
});

ipcMain.on("cancelUpdate", event => {
  cancelUpdater();
});

module.exports = { checkForUpdates };
