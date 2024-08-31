import { dialog } from 'electron';
import { mainLoader } from './main-loader.js';
import Sharp from 'sharp';
import { existsSync } from 'fs';
import tileJoiner from './tile-joiner.js';
import tileMultiplier from './tile-multiplier.js';
import tileExtractor from './tile-extractor.js';

export class EventRouter {
  constructor(ipcMain: Electron.IpcMain, mainWindow: Electron.BrowserWindow, isDev: boolean) {
    ipcMain.on('ready', () => mainLoader(mainWindow, isDev));

    ipcMain.on('showOpenDialogSync', (_, data) => {
      mainWindow.webContents.send('showOpenDialogSync', dialog.showOpenDialogSync(mainWindow, data));
    });

    ipcMain.on('showSaveDialogSync', (_, data) => {
      mainWindow.webContents.send('showSaveDialogSync', dialog.showSaveDialogSync(mainWindow, data));
    });

    ipcMain.on('showMessageBoxSync', (_, data) => {
      mainWindow.webContents.send('showMessageBoxSync', dialog.showMessageBoxSync(mainWindow, data));
    });

    ipcMain.on('getSizes', async (_, data) => {
      if (!existsSync(data)) {
        console.log('File does not exist');
        return;
      }

      const { width, height } = await Sharp(data).metadata();

      mainWindow.webContents.send('getSizes', {
        sizes: {
          width: width || 0,
          height: height || 0,
        },
      });
    });

    ipcMain.on('joinTiles', async (_, data) => tileJoiner(mainWindow, data));
    ipcMain.on('multiplyTile', async (_, data) => tileMultiplier(mainWindow, data));
    ipcMain.on('extractTiles', async (_, data) => tileExtractor(mainWindow, data));
  }
}
