<script lang="ts">
  import { onMount } from 'svelte';
  import supportedExtensions from '../../libs/supportedExtensions';
  import SelectFile from '../../components/SelectFile.svelte';

  let tileSizeCalculation: 'tile' | 'manual' = 'tile';
  let tileSizes = { width: 0, height: 0 };
  let tilesQuantity = { xQuantity: 0, yQuantity: 0 };
  let fullImageSizes = { width: 0, height: 0 };
  let tileNaming: '{n}' | '{x}-{y}' | '{y}-{x}' | 'template' = '{n}';
  let tileNamingTemplate: string = tileNaming;
  let indexOffset = 0;
  let fullImage: Array<AppFile> = [];
  let fullImagePath = '';
  let outputPath = '';
  let outputExtension = 'webp';
  let consoleLogs: string[] = [];
  let isRunning = false;
  let consoleDiv: HTMLDivElement | null = null;

  $: if (tileSizeCalculation === 'tile') {
    tileSizes = {
      width: fullImageSizes.width / tilesQuantity.xQuantity || 0,
      height: fullImageSizes.height / tilesQuantity.yQuantity || 0,
    };
  } else {
    tilesQuantity = {
      xQuantity: Math.ceil(fullImageSizes.width / tileSizes.width) || 0,
      yQuantity: Math.ceil(fullImageSizes.height / tileSizes.height) || 0,
    };
  }

  $: if (fullImage.length > 0) {
    console.log({ fullImage });
    fullImagePath = fullImage[0].fullPath;
    window.electron.send('getSizes', fullImagePath);
  }

  $: console.log({ fullImage });

  function startTileJoin() {
    if (
      !fullImagePath ||
      !outputPath ||
      !outputExtension ||
      tilesQuantity.xQuantity === 0 ||
      tilesQuantity.yQuantity === 0 ||
      tileSizes.width === 0 ||
      tileSizes.height === 0 ||
      fullImageSizes.width === 0 ||
      fullImageSizes.height === 0 ||
      (tileNaming === 'template' && !tileNamingTemplate)
    ) {
      console.log({
        fullImagePath,
        outputPath,
        outputExtension,
        tilesQuantity,
        tileSizes,
        fullImageSizes,
        tileNaming,
        tileNamingTemplate,
      });

      if (fullImageSizes.width % tileSizes.width !== 0 || fullImageSizes.height % tileSizes.height !== 0) {
        window.electron.send('showMessageBoxSync', {
          title: 'Error',
          message: 'Full image size must be dividable by tile size',
          type: 'error',
        });
        return;
      }

      window.electron.send('showMessageBoxSync', {
        title: 'Error',
        message: 'Please fill all fields',
        type: 'error',
      });
      return;
    }

    consoleLogs = [];
    isRunning = true;

    window.electron.send('extractTiles', {
      inputPath: fullImagePath,
      inputExtension: fullImagePath.split('.').pop()!,
      outputPath,
      outputExtension,
      xQuantity: tilesQuantity.xQuantity,
      yQuantity: tilesQuantity.yQuantity,
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
    window.electron.receive('getSizes', (data) => (fullImageSizes = data.sizes));

    window.electron.receive('showOpenDialogSync', (path) => {
      if (!path || path.length < 0) return;

      const [selectedPath] = path;
      outputPath = selectedPath;
    });

    window.electron.receive('extractTilesFeedback', (data) => {
      if (data.message === 'Tiles extracted successfully' || data.message === 'Cancelled process') {
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
    <span class="text-3xl border-b p-2">Full image</span>
    <div class="p-2 flex flex-col gap-2">
      <SelectFile bind:files="{fullImage}" />
      <div class="flex flex-col pl-2">
        <span>Image Width: {fullImageSizes.width}px</span>
        <span>Image Height: {fullImageSizes.height}px</span>
      </div>
    </div>
  </div>

  <div class="flex flex-col">
    <span class="text-3xl border-b p-2">Tile image size calculation</span>
    <div class="p-2 flex flex-col gap-2">
      <div>
        By:
        <select
          class="w-fit text-black px-4 py-1 rounded-md"
          bind:value="{tileSizeCalculation}"
        >
          <option value="tile">Tile x & y quantity</option>
          <option value="manual">Manual value</option>
        </select>
      </div>

      <div class="flex flex-col w-fit gap-2">
        {#if tileSizeCalculation === 'tile'}
          <label>
            <span class="text-xl">x</span> quantity:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{tilesQuantity.xQuantity}"
            />
            ( {tileSizes.width} px )
          </label>
          <label>
            <span class="text-xl">y</span> quantity:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{tilesQuantity.yQuantity}"
            />
            ( {tileSizes.height} px )
          </label>
        {:else if tileSizeCalculation === 'manual'}
          <label>
            Width:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{tileSizes.width}"
            /> px
          </label>
          <label>
            Height:
            <input
              type="number"
              class="text-black px-4 py-1 rounded-md"
              bind:value="{tileSizes.height}"
            /> px
          </label>
        {/if}
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
            window.electron.send('showOpenDialogSync', {
              title: 'Save to',
              properties: ['openDirectory'],
            });
          }}">Select output path</button
        >
        <select
          class="w-fit text-black px-4 py-1 rounded-md"
          bind:value="{outputExtension}"
        >
          {#each supportedExtensions as extension}
            <option value="{extension}">{extension}</option>
          {/each}
        </select>
        <div class="flex flex-col">
          <span class="font-light">Selected path: <span class="font-normal">{outputPath || 'N/A'}</span></span>
          <span class="font-light">Selected extension: <span class="font-normal">{outputExtension || 'N/A'}</span></span>
        </div>
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
