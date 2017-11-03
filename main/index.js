const prepareNext = require("electron-next");
const { app, ipcMain } = require("electron");
const Store = require("electron-store");

const { createMainWindow } = require("./main");
const { createAboutWindow } = require("./about");
const { createCheckWindow } = require("./updaterCheck");
const { createProgressWindow } = require("./updaterProgress");

const { textSearch, fileSearch } = require("./sources");
const { singleDownload } = require("./download");
const { download } = require("./sources/addic7ed");
const buildMenu = require("./menu");

let aboutWindow;
let mainWindow;
let progressWindow;
let checkWindow;
let willQuitApp = false;
const store = new Store();

const showAboutWindow = () => {
  aboutWindow.show();
  aboutWindow.focus();
};

const onCloseAboutWindow = event => {
  if (willQuitApp) {
    aboutWindow = null;
    return;
  }

  event.preventDefault();
  aboutWindow.hide();
};

const initSettings = () => {
  // Set default language
  if (!store.has("language")) {
    store.set("language", "eng");
  }

  // Get settings
  ipcMain.on("getStore", (event, setting) => {
    if (setting === "language") {
      const language = store.get("language");
      mainWindow.webContents.send("language", language);
    }
  });

  // Set settings
  ipcMain.on("setStore", (event, key, value) => {
    store.set(key, value);
  });
};

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  // Windows
  mainWindow = createMainWindow();
  aboutWindow = createAboutWindow();
  checkWindow = createCheckWindow();
  progressWindow = createProgressWindow();

  // Menu
  buildMenu(aboutWindow, showAboutWindow);
  aboutWindow.on("close", event => onCloseAboutWindow(event));

  // Setting globals
  global.windows = {
    mainWindow,
    aboutWindow,
    checkWindow,
    progressWindow,
  };

  global.updater = {
    onStartup: true,
  };

  initSettings();

  ipcMain.on("downloadSubtitle", (event, item) => {
    if (!item) {
      return false;
    }

    if (item.source === "addic7ed") {
      return download(item);
    }

    return singleDownload(item);
  });

  ipcMain.on("textSearch", async (event, query, language) =>
    textSearch(query, language, "all"));

  ipcMain.on("fileSearch", async (event, files, language) =>
    fileSearch(files, language, "best"));
});

// Quit the app once all windows are closed
app.on("before-quit", () => {
  willQuitApp = true;
});

app.on("window-all-closed", app.quit);
