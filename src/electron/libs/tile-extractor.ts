import { spawnSync } from 'child_process';
import { dialog } from 'electron';
import { join } from 'path';
import Sharp from 'sharp';

async function extractImagesByIndex(
  mainWindow: Electron.BrowserWindow,
  sharp: Sharp.Sharp,
  options: {
    outputPath: string;
    outputExtension: string;
    yQuantity: number;
    xQuantity: number;
    tileWidth: number;
    tileHeight: number;
    offset: number;
    positionFormat: '{n}' | 'template';
    positionTemplate: string;
  },
) {
  let i = options.offset - 1;
  for (let y = 0; y < options.yQuantity; y++) {
    for (let x = 0; x < options.xQuantity; x++) {
      ++i;

      const path = join(
        options.outputPath,
        `${
          options.positionFormat === 'template' && options.positionTemplate
            ? options.positionTemplate.replace('{n}', i.toString())
            : options.positionFormat.replace('{n}', i.toString())
        }.${options.outputExtension}`,
      );

      const top = y * options.tileHeight;
      const left = x * options.tileWidth;

      await new Promise<void>((resolve) => {
        sharp
          .clone()
          .extract({
            left,
            top,
            width: options.tileWidth,
            height: options.tileHeight,
          })
          .toFormat(options.outputExtension as keyof Sharp.FormatEnum, {
            quality: 100,
            lossless: true,
            alphaQuality: 100,
            force: true,
            effort: 6,
          })
          .toFile(path, (err) => {
            if (err) {
              console.error(err);
              mainWindow.webContents.send('extractTilesFeedback', {
                message: `Error extracting tile '${path}' (${err})`,
              });
            }

            resolve();
          });
      });

      console.log(`  | Tile '${path}' extracted, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`);
      mainWindow.webContents.send('extractTilesFeedback', {
        message: `Tile '${path}' extracted, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`,
      });
    }
  }
}

async function extractImagesByTilePosition(
  mainWindow: Electron.BrowserWindow,
  sharp: Sharp.Sharp,
  options: {
    outputPath: string;
    outputExtension: string;
    yQuantity: number;
    xQuantity: number;
    tileWidth: number;
    tileHeight: number;
    offset: number;
    positionFormat: '{x}-{y}' | '{y}-{x}' | 'template';
    positionTemplate: string;
  },
) {
  for (let y = options.offset; y < options.yQuantity + options.offset; y++) {
    for (let x = options.offset; x < options.xQuantity + options.offset; x++) {
      const path = join(
        options.outputPath,
        `${
          options.positionFormat === 'template' && options.positionTemplate
            ? options.positionTemplate.replace('{x}', x.toString()).replace('{y}', y.toString())
            : options.positionFormat.replace('{x}', x.toString()).replace('{y}', y.toString())
        }.${options.outputExtension}`,
      );

      const top = y * options.tileHeight;
      const left = x * options.tileWidth;

      await new Promise<void>((resolve) => {
        sharp
          .clone()
          .extract({
            left,
            top,
            width: options.tileWidth,
            height: options.tileHeight,
          })
          .toFormat(options.outputExtension as keyof Sharp.FormatEnum, {
            quality: 100,
            lossless: true,
            alphaQuality: 100,
            force: true,
            effort: 6,
          })
          .toFile(path, (err) => {
            if (err) {
              console.error(err);
              mainWindow.webContents.send('extractTilesFeedback', {
                message: `Error extracting tile '${path}' (${err})`,
              });
            }

            resolve();
          });
      });

      console.log(`  | Tile '${path}' extracted, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`);
      mainWindow.webContents.send('extractTilesFeedback', {
        message: `Tile '${path}' extracted, x: ${x}, y: ${y}, top: ${top}px, left: ${left}px`,
      });
    }
  }
}

export default async function tileExtractor(
  mainWindow: Electron.BrowserWindow,
  options: {
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
        title: 'Extract tiles',
        message: `Extracting ${
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
          title: 'Cancel extracting tiles?',
          message: 'Are you sure you want to cancel the process?',
          buttons: ['No', 'Yes'],
        })
      ).response !== 0
    ) {
      mainWindow.webContents.send('extractTilesFeedback', {
        message: 'Cancelled process',
      });
      return;
    }
  }

  mainWindow.webContents.send('extractTilesFeedback', {
    message: "Starting to extract tiles, this may take a while. Don't close the app",
  });

  console.log(`\nExtracting tiles...`);

  mainWindow.webContents.send('extractTilesFeedback', {
    message: 'Extracted tiles, this may take a while.',
  });

  const sharpImage = Sharp(options.inputPath);

  switch (options.positionFormat) {
    case '{n}':
      await extractImagesByIndex(mainWindow, sharpImage, {
        outputPath: options.outputPath,
        outputExtension: options.outputExtension,
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
      await extractImagesByTilePosition(mainWindow, sharpImage, {
        outputPath: options.outputPath,
        outputExtension: options.outputExtension,
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
        await extractImagesByTilePosition(mainWindow, sharpImage, {
          outputPath: options.outputPath,
          outputExtension: options.outputExtension,
          yQuantity: options.yQuantity,
          xQuantity: options.xQuantity,
          tileWidth: options.tileWidth,
          tileHeight: options.tileHeight,
          offset: options.offset,
          positionFormat: options.positionFormat,
          positionTemplate: options.positionTemplate,
        });
      } else if (options.positionTemplate.includes('{n}')) {
        await extractImagesByIndex(mainWindow, sharpImage, {
          outputPath: options.outputPath,
          outputExtension: options.outputExtension,
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

  console.log('  | Tiles extracted successfully');
  mainWindow.webContents.send('extractTilesFeedback', {
    message: 'Tiles extracted successfully',
  });

  const showMessageBox_result = await dialog.showMessageBox({
    type: 'info',
    title: 'Success',
    message: 'Tiles extracted successfully',
    buttons: ['OK', 'Open folder'],
  });

  switch (showMessageBox_result.response) {
    case 1: {
      spawnSync('explorer', [options.outputPath], { shell: true });
      break;
    }
  }
}
