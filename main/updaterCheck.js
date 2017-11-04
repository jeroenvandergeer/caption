// Native
const { format } = require("url");

// Packages
const { BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");
const { resolve } = require("app-root-path");

let checkWindow;

const createCheckWindow = () => {
  checkWindow = new BrowserWindow({
    width: 400,
    height: 130,
    title: "Updating Caption",
    center: true,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    backgroundColor: "#ECECEC",
  });

  const devPath = "http://localhost:8000/updaterProgress";

  const prodPath = format({
    pathname: resolve("renderer/out/updaterProgress/index.html"),
    protocol: "file:",
    slashes: true,
  });

  const url = isDev ? devPath : prodPath;
  checkWindow.loadURL(url);

  return checkWindow;
};

const showCheckWindow = () => {
  checkWindow.show();
  checkWindow.focus();
};

module.exports = { createCheckWindow, showCheckWindow };
