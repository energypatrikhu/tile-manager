<script lang="ts">
  import { onMount } from 'svelte';

  const supportedExtensions = [
    'avif',
    'dz',
    'fits',
    'gif',
    'heif',
    'input',
    'jpeg',
    'jpg',
    'jp2',
    'jxl',
    'magick',
    'openslide',
    'pdf',
    'png',
    'ppm',
    'raw',
    'svg',
    'tiff',
    'tif',
    'v',
    'webp',
  ];

  let tileGap = 0;
  let tileSizes = { width: 0, height: 0 };
  let fullImageSizes = { width: 0, height: 0 };
  let fullImageSizesByTiles = { xQuantity: 0, yQuantity: 0 };
  let tile: FileList;
  let tilePath = '';
  let outputPath = '';
  let outputExtension = 'webp';
  let consoleLogs: string[] = [];
  let multiplyingTile = false;
  let consoleDiv: HTMLDivElement | null = null;

  $: fullImageSizes = {
    width: tileSizes.width * fullImageSizesByTiles.xQuantity || 0,
    height: tileSizes.height * fullImageSizesByTiles.yQuantity || 0,
  };

  $: if (tile && tile.length > 0) {
    let imageTiles = Array.from(tile).filter((file) => file.type.startsWith('image/'));

    if (imageTiles.length > 0) {
      console.log({ imageTiles });
      tilePath = imageTiles[0].path;
      window.electron.send('getTileSizes', imageTiles[0].path);
    }
  }

  function startTileJoin() {
    if (
      !tilePath ||
      !outputPath ||
      !outputExtension ||
      fullImageSizesByTiles.xQuantity === 0 ||
      fullImageSizesByTiles.yQuantity === 0 ||
      tileSizes.width === 0 ||
      tileSizes.height === 0 ||
      fullImageSizes.width === 0 ||
      fullImageSizes.height === 0
    ) {
      window.electron.send('showMessageBoxSync', {
        title: 'Error',
        message: 'Please fill all fields',
        type: 'error',
      });
      return;
    }

    consoleLogs = [];
    multiplyingTile = true;

    window.electron.send('multiplyTile', {
      tileGap,
      inputPath: tilePath,
      inputExtension: tilePath.split('.').pop()!,
      outputPath,
      outputExtension,
      xQuantity: fullImageSizesByTiles.xQuantity,
      yQuantity: fullImageSizesByTiles.yQuantity,
      tileWidth: tileSizes.width,
      tileHeight: tileSizes.height,
      fullImageWidth: fullImageSizes.width,
      fullImageHeight: fullImageSizes.height,
    });
  }

  onMount(() => {
    window.electron.receive('getTileSizes', (data) => (tileSizes = data.tileSizes));

    window.electron.receive('showSaveDialogSync', (path) => {
      if (!path) return;

      const extension = path.split('.').pop();
      outputExtension = extension ? (supportedExtensions.includes(extension) ? extension : outputExtension) : outputExtension;
      outputPath = path.slice(0, path.lastIndexOf('.')) + '.' + outputExtension;
    });

    window.electron.receive('multiplyTileFeedback', (data) => {
      if (data.message === 'Tile multiplied successfully') {
        multiplyingTile = false;
      }

      consoleLogs = [...consoleLogs, data.message];

      setTimeout(() => {
        if (consoleDiv) {
          consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
      }, 100);
    });
  });
</script>

<div class="flex flex-col gap-4 px-2">
  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Tile</span>
    <div class="p-2 flex flex-col gap-2">
      <input
        type="file"
        accept="image/*"
        bind:files="{tile}"
      />
      <div class="flex flex-col pl-2">
        <span>Tile Width: {tileSizes.width}px</span>
        <span>Tile Height: {tileSizes.height}px</span>
      </div>
    </div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Full image size calculation</span>
    <div class="p-2 flex flex-col gap-2">
      <div class="flex flex-col w-fit gap-2">
        <label>
          <span class="text-xl">x</span> quantity:
          <input
            type="number"
            class="text-black px-4 py-1 rounded-md"
            bind:value="{fullImageSizesByTiles.xQuantity}"
          />
          ( {fullImageSizes.width} px )
        </label>
        <label>
          <span class="text-xl">y</span> quantity:
          <input
            type="number"
            class="text-black px-4 py-1 rounded-md"
            bind:value="{fullImageSizesByTiles.yQuantity}"
          />
          ( {fullImageSizes.height} px )
        </label>
      </div>
    </div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Tile gap</span>
    <div class="p-2 flex flex-col gap-2">
      <div class="flex flex-col w-fit gap-2">
        <label>
          <input
            type="number"
            class="text-black px-4 py-1 rounded-md"
            bind:value="{tileGap}"
          /> px
        </label>
      </div>
    </div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Output</span>
    <div class="p-2">
      <div>
        <button
          class="bg-white text-black hover:bg-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-1 rounded-md"
          disabled="{multiplyingTile}"
          on:click="{() => {
            window.electron.send('showSaveDialogSync', {
              title: 'Save As',
              defaultPath: 'output.webp',
              filters: [{ name: 'Images', extensions: supportedExtensions }],
            });
          }}">Select output</button
        >
        <span class="font-light"> Selected: </span>
        <span>{outputPath || 'N/A'}</span>
      </div>
    </div>
  </div>

  <div class="flex flex-col justify-center items-center">
    <div class="h-[1px] bg-white w-[calc(50%-104.4px)] left-2 absolute"></div>
    <div>
      <button
        class="bg-white text-black hover:bg-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed px-16 py-2 text-2xl rounded-xl"
        disabled="{multiplyingTile}"
        on:click="{startTileJoin}">Start</button
      >
    </div>
    <div class="h-[1px] bg-white w-[calc(50%-104.4px)] right-2 absolute"></div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Console</span>
    <div class="p-2">
      <div>
        <div
          bind:this="{consoleDiv}"
          class="flex flex-col gap-2 h-32 overflow-auto bg-slate-800"
        >
          {#each consoleLogs as log}
            <span>{log}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
