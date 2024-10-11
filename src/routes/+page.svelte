<script lang="ts">
  import { onMount } from 'svelte';
  import supportedExtensions from '../libs/supportedExtensions';
  import SelectFile from '../components/SelectFile.svelte';

  let tileGap = 0;
  let fullImageSizeCalculation: 'tile' | 'manual' = 'tile';
  let tileSizes = { width: 0, height: 0 };
  let fullImageSizes = { width: 0, height: 0 };
  let fullImageSizesByTiles = { xQuantity: 0, yQuantity: 0 };
  let tileNaming: '{n}' | '{x}-{y}' | '{y}-{x}' | 'template' = '{n}';
  let tileNamingTemplate: string = tileNaming;
  let indexOffset = 0;
  let tiles: Array<AppFile> = [];
  let tilePath = '';
  let outputPath = '';
  let outputExtension = 'webp';
  let consoleLogs: string[] = [];
  let isRunning = false;
  let consoleDiv: HTMLDivElement | null = null;

  $: if (fullImageSizeCalculation === 'tile') {
    fullImageSizes = {
      width: tileSizes.width * fullImageSizesByTiles.xQuantity || 0,
      height: tileSizes.height * fullImageSizesByTiles.yQuantity || 0,
    };
  } else {
    fullImageSizesByTiles = {
      xQuantity: Math.ceil(fullImageSizes.width / tileSizes.width) || 0,
      yQuantity: Math.ceil(fullImageSizes.height / tileSizes.height) || 0,
    };
  }

  $: if (tiles.length > 0) {
    console.log({ tiles });
    tilePath = tiles[0].fullPath;
    window.electron.send('getSizes', tilePath);
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
      fullImageSizes.height === 0 ||
      (tileNaming === 'template' && !tileNamingTemplate)
    ) {
      window.electron.send('showMessageBoxSync', {
        title: 'Error',
        message: 'Please fill all fields',
        type: 'error',
      });
      return;
    }

    consoleLogs = [];
    isRunning = true;

    window.electron.send('joinTiles', {
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
      offset: indexOffset,
      positionFormat: tileNaming,
      positionTemplate: tileNamingTemplate,
    });
  }

  onMount(() => {
    window.electron.receive('getSizes', (data) => (tileSizes = data.sizes));

    window.electron.receive('showSaveDialogSync', (path) => {
      if (!path) return;

      const extension = path.split('.').pop();
      outputExtension = extension ? (supportedExtensions.includes(extension) ? extension : outputExtension) : outputExtension;
      outputPath = path.slice(0, path.lastIndexOf('.')) + '.' + outputExtension;
    });

    window.electron.receive('joinTilesFeedback', (data) => {
      if (data.message === 'Tiles joined successfully' || data.message === 'Cancelled process') {
        isRunning = false;
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
    <span class="text-3xl border-b p-2">Tiles</span>
    <div class="p-2 flex flex-col gap-2">
      <SelectFile
        bind:files="{tiles}"
        multiple="{true}"
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
      <div>
        By:
        <select
          class="w-fit text-black px-4 py-1 rounded-md"
          bind:value="{fullImageSizeCalculation}"
        >
          <option value="tile">Tile x & y quantity</option>
          <option value="manual">Manual value</option>
        </select>
      </div>

      <div class="flex flex-col w-fit gap-2">
        {#if fullImageSizeCalculation === 'tile'}
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
        {:else if fullImageSizeCalculation === 'manual'}
          <label>
            Width:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{fullImageSizes.width}"
            /> px
          </label>
          <label>
            Height:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{fullImageSizes.height}"
            /> px
          </label>
        {/if}
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
    <span class="text-3xl border-b p-2">Tile naming</span>
    <div class="p-2 flex flex-col gap-2">
      <span class="font-light">Example: '3.png', '1-2.jpg', '2-1.webp', ...</span>
      <div>
        <select
          class="w-fit text-black px-4 py-1 rounded-md"
          bind:value="{tileNaming}"
        >
          <option value="{'{n}'}">ID / incremental</option>
          <option value="{'{x}-{y}'}">X-Y</option>
          <option value="{'{y}-{x}'}">Y-X</option>
          <option value="template">Custom template</option>
        </select>
      </div>
    </div>

    {#if tileNaming === 'template'}
      <div class="p-2 flex flex-col gap-2">
        <div class="flex flex-col">
          <span class="font-light">Possible templates: {'{n} {x} {y}'}</span>
          <span class="font-light"><span class="font-normal">{'{n} =>'}</span> indexed / incremental / by id</span>
          <span class="font-light"><span class="font-normal">{'{x}, {y} =>'}</span> by x,y or y,x coordinate</span>
          <span class="font-light">Example: 'tile ({'{n}'})', 'tile-({'{x}-{y}'})', ...</span>
        </div>
        <div>
          <input
            class="w-fit text-black px-4 py-1 rounded-md"
            type="text"
            bind:value="{tileNamingTemplate}"
          />
        </div>
      </div>
    {/if}
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">First number in tile naming</span>
    <div class="p-2 flex flex-col gap-2">
      <span class="font-light">Example: '0.png', '0-0.jpg', '1.png', '1-1.jpeg', ...</span>
      <div>
        <input
          type="number"
          class="text-black px-4 py-1 rounded-md"
          bind:value="{indexOffset}"
        />
      </div>
    </div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Output</span>
    <div class="p-2">
      <div>
        <button
          class="bg-white text-black hover:bg-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-1 rounded-md"
          disabled="{isRunning}"
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
        disabled="{isRunning}"
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
