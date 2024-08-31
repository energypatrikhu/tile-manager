import { spawnSync } from 'child_process';
import { dialog } from 'electron';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import Sharp from 'sharp';

function getImagesByIndex(
  mainWindow: Electron.BrowserWindow,
  options: {
    tileGap: number;
    tileBasePath: string;
    extension: string;
    yQuantity: number;
    xQuantity: number;
    tileWidth: number;
    tileHeight: number;
    offset: number;
    positionFormat: '{n}' | 'template';
    positionTemplate?: string;
  },
) {
  const images = [];

  let i = options.offset - 1;
  for (let y = 0; y < options.yQuantity; y++) {
    for (let x = 0; x < options.xQuantity; x++) {
      ++i;

      const path = join(
        options.tileBasePath,
        `${
          options.positionFormat === 'template' && options.positionTemplate
            ? options.positionTemplate.replace('{n}', i.toString())
            : options.positionFormat.replace('{n}', i.toString())
        }.${options.extension}`,
      );

      if (!existsSync(path)) {
        console.log(`X | Tile '${path}' not found`);
        mainWindow.webContents.send('joinTilesFeedback', {
          message: `Tile '${path}' not found`,
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
        input: path,
        top,
        left,
      });

      console.log(`  | Tile '${path}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`);
      mainWindow.webContents.send('joinTilesFeedback', {
        message: `Tile '${path}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`,
      });
    }
  }

  return images;
}

function getImagesByTilePosition(
  mainWindow: Electron.BrowserWindow,
  options: {
    tileGap: number;
    tileBasePath: string;
    extension: string;
    yQuantity: number;
    xQuantity: number;
    tileWidth: number;
    tileHeight: number;
    offset: number;
    positionFormat: '{x}-{y}' | '{y}-{x}' | 'template';
    positionTemplate?: string;
  },
) {
  const images = [];

  for (let y = options.offset; y < options.yQuantity + options.offset; y++) {
    for (let x = options.offset; x < options.xQuantity + options.offset; x++) {
      const path = join(
        options.tileBasePath,
        `${
          options.positionFormat === 'template' && options.positionTemplate
            ? options.positionTemplate.replace('{x}', x.toString()).replace('{y}', y.toString())
            : options.positionFormat.replace('{x}', x.toString()).replace('{y}', y.toString())
        }.${options.extension}`,
      );

      if (!existsSync(path)) {
        console.log(`X | Tile '${path}' not found`);
        mainWindow.webContents.send('joinTilesFeedback', {
          message: `Tile '${path}' not found`,
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
        input: path,
        top,
        left,
      });

      console.log(`  | Tile '${path}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`);
      mainWindow.webContents.send('joinTilesFeedback', {
        message: `Tile '${path}' added, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`,
      });
    }
  }

  return images;
}

export default async function tileJoiner(
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
    offset: number;
    positionFormat: '{n}' | '{x}-{y}' | '{y}-{x}' | 'template';
    positionTemplate: string;
  },
) {
  if (
    (
      await dialog.showMessageBox({
        type: 'question',
        title: 'Joining tiles',
        message: `Joining ${
          options.xQuantity * options.yQuantity
        } tile(s), this may take a while. Do you want to continue?\n\nOutput path: ${options.outputPath}`,
        buttons: ['Cancel', 'Yes'],
      })
    ).response === 0
  ) {
    if (
      (
        await dialog.showMessageBox({
          type: 'warning',
          title: 'Cancel joining tiles?',
          message: 'Are you sure you want to cancel the process?',
          buttons: ['No', 'Yes'],
        })
      ).response !== 0
    ) {
      mainWindow.webContents.send('joinTilesFeedback', {
        message: 'Cancelled process',
      });
      return;
    }
  }

  mainWindow.webContents.send('joinTilesFeedback', {
    message: "Starting to join tiles, this may take a while. Don't close the app",
  });

  const tileBasePath = options.inputPath.slice(0, -basename(options.inputPath).length);

  let images: Sharp.OverlayOptions[] = [];
  switch (options.positionFormat) {
    case '{n}':
      images = getImagesByIndex(mainWindow, {
        tileGap: options.tileGap,
        tileBasePath,
        extension: options.inputExtension,
        yQuantity: options.yQuantity,
        xQuantity: options.xQuantity,
        tileWidth: options.tileWidth,
        tileHeight: options.tileHeight,
        offset: options.offset,
        positionFormat: options.positionFormat,
        positionTemplate: options.positionTemplate,
      });
      break;

    case '{x}-{y}':
    case '{y}-{x}':
      images = getImagesByTilePosition(mainWindow, {
        tileGap: options.tileGap,
        tileBasePath,
        extension: options.inputExtension,
        yQuantity: options.yQuantity,
        xQuantity: options.xQuantity,
        tileWidth: options.tileWidth,
        tileHeight: options.tileHeight,
        offset: options.offset,
        positionFormat: options.positionFormat,
        positionTemplate: options.positionTemplate,
      });
      break;

    case 'template':
      if (options.positionTemplate.includes('{x}') && options.positionTemplate.includes('{y}')) {
        images = getImagesByTilePosition(mainWindow, {
          tileGap: options.tileGap,
          tileBasePath,
          extension: options.inputExtension,
          yQuantity: options.yQuantity,
          xQuantity: options.xQuantity,
          tileWidth: options.tileWidth,
          tileHeight: options.tileHeight,
          offset: options.offset,
          positionFormat: options.positionFormat,
          positionTemplate: options.positionTemplate,
        });
      } else if (options.positionTemplate.includes('{n}')) {
        images = getImagesByIndex(mainWindow, {
          tileGap: options.tileGap,
          tileBasePath,
          extension: options.inputExtension,
          yQuantity: options.yQuantity,
          xQuantity: options.xQuantity,
          tileWidth: options.tileWidth,
          tileHeight: options.tileHeight,
          offset: options.offset,
          positionFormat: options.positionFormat,
          positionTemplate: options.positionTemplate,
        });
      }
      break;
  }

  console.log(`\nJoining ${images.length} tiles...`);

  mainWindow.webContents.send('joinTilesFeedback', {
    message: 'Joining tiles, this may take a while.',
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
        console.log('X | Error joining tiles:', err);
        mainWindow.webContents.send('joinTilesFeedback', {
          message: 'Error joining tiles!',
        });
        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Error',
          message: 'Error joining tiles',
          detail: err.message,
        });
        return;
      }

      console.log('  | Tiles joined successfully');
      mainWindow.webContents.send('joinTilesFeedback', {
        message: 'Tiles joined successfully',
      });

      const showMessageBox_result = await dialog.showMessageBox({
        type: 'info',
        title: 'Success',
        message: 'Tiles joined successfully',
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
