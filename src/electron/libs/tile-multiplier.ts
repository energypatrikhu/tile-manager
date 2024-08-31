import { spawnSync } from 'child_process';
import { dialog } from 'electron';
import { existsSync } from 'fs';
import { basename } from 'path';
import Sharp from 'sharp';

function getImagesArray(
  mainWindow: Electron.BrowserWindow,
  options: {
    tileGap: number;
    tilePath: string;
    extension: string;
    yQuantity: number;
    xQuantity: number;
    tileWidth: number;
    tileHeight: number;
  },
) {
  const images = [];

  for (let y = 0; y < options.yQuantity; y++) {
    for (let x = 0; x < options.xQuantity; x++) {
      if (!existsSync(options.tilePath)) {
        console.log(`X | Tile '${options.tilePath}' not found`);
        mainWindow.webContents.send('multiplyTileFeedback', {
          message: `Tile '${options.tilePath}' not found`,
        });
        continue;
      }

      let top = 0;
      let left = 0;

      if (y > 0) {
        top = y * options.tileHeight + y * options.tileGap;
      } else {
        top = y * options.tileHeight;
      }

      if (x > 0) {
        left = x * options.tileWidth + x * options.tileGap;
      } else {
        left = x * options.tileWidth;
      }

      images.push({
        input: options.tilePath,
        top,
        left,
      });

      console.log(`  | Tile '${options.tilePath}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`);
      mainWindow.webContents.send('multiplyTileFeedback', {
        message: `Tile '${options.tilePath}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`,
      });
    }
  }

  return images;
}

export default async function tileMultiplier(
  mainWindow: Electron.BrowserWindow,
  options: {
    tileGap: number;
    inputPath: string;
    inputExtension: string;
    outputPath: string;
    outputExtension: string;
    xQuantity: number;
    yQuantity: number;
    tileWidth: number;
    tileHeight: number;
    fullImageWidth: number;
    fullImageHeight: number;
  },
) {
  if (
    (
      await dialog.showMessageBox({
        type: 'question',
        title: 'Multiply tile',
        message: `Multiplying tile, this may take a while. Do you want to continue?\n\nOutput path: ${options.outputPath}`,
        buttons: ['Cancel', 'Yes'],
      })
    ).response === 0
  ) {
    if (
      (
        await dialog.showMessageBox({
          type: 'warning',
          title: 'Cancel multiplying tile?',
          message: 'Are you sure you want to cancel the process?',
          buttons: ['No', 'Yes'],
        })
      ).response !== 0
    ) {
      mainWindow.webContents.send('multiplyTileFeedback', {
        message: 'Cancelled process',
      });
      return;
    }
  }

  mainWindow.webContents.send('multiplyTileFeedback', {
    message: "Starting to multiply tile, this may take a while. Don't close the app",
  });

  let images = getImagesArray(mainWindow, {
    tileGap: options.tileGap,
    tilePath: options.inputPath,
    extension: options.inputExtension,
    yQuantity: options.yQuantity,
    xQuantity: options.xQuantity,
    tileWidth: options.tileWidth,
    tileHeight: options.tileHeight,
  });

  console.log(`\nMultiplying ${images.length} tile...`);

  mainWindow.webContents.send('multiplyTileFeedback', {
    message: 'Multiplying tile, this may take a while.',
  });

  Sharp({
    create: {
      width: options.fullImageWidth + options.tileGap * (options.xQuantity - 1),
      height: options.fullImageHeight + options.tileGap * (options.yQuantity - 1),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(images)
    .toFormat(options.outputExtension as keyof Sharp.FormatEnum, {
      quality: 100,
      lossless: true,
      alphaQuality: 100,
      force: true,
    })
    .toFile(options.outputPath, async (err) => {
      if (err) {
        console.log('X | Error multiplying tile:', err);
        mainWindow.webContents.send('multiplyTileFeedback', {
          message: 'Error multiplying tile!',
        });
        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Error',
          message: 'Error multiplying tile',
          detail: err.message,
        });
        return;
      }

      console.log('  | Tile multiplied successfully');
      mainWindow.webContents.send('multiplyTileFeedback', {
        message: 'Tile multiplied successfully',
      });

      const showMessageBox_result = await dialog.showMessageBox({
        type: 'info',
        title: 'Success',
        message: 'Tile multiplied successfully',
        buttons: ['OK', 'Open folder', 'Open file'],
      });

      switch (showMessageBox_result.response) {
        case 1: {
          spawnSync('explorer', [options.outputPath.slice(0, -basename(options.outputPath).length)], { shell: true });
          break;
        }
        case 2: {
          spawnSync('explorer', [options.outputPath], { shell: true });
          break;
        }
      }
    });
}
