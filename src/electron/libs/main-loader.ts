import { app, BrowserWindow } from 'electron';
import { readFile } from 'fs/promises';

import { Updater } from './updater.js';

function triggerReady(mainWindow: BrowserWindow, data: any) {
  mainWindow.webContents.send('ready', data);
}

export async function mainLoader(mainWindow: BrowserWindow, isDev: boolean) {
  const versions = {
    electronVersion: isDev ? app.getVersion() : process.versions.electron,
    appVersion: isDev ? JSON.parse(await readFile('./package.json', 'utf-8')).version : app.getVersion(),
  };

  if (isDev) {
    triggerReady(mainWindow, { versions });
    return;
  }

  mainWindow.webContents.send('update', { message: 'Checking for update...' });
  if (await new Updater(mainWindow, versions.appVersion).check()) {
    mainWindow.webContents.send('update', { message: 'Update available, downloading update...' });
    return;
  }

  triggerReady(mainWindow, { versions });
}
