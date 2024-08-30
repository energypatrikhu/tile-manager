<script lang="ts">
  import '../app.css';
  import Loading from '$components/Loading.svelte';

  import { onMount } from 'svelte';
  import app from '$stores/app';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';

  let ready = false;
  let loadingMessage = 'Loading...';

  let pages = [
    { name: 'Tile Joiner', path: '/' },
    { name: 'Tile Multiplier', path: '/multiplier' },
  ];

  window.addEventListener('mouseup', (mouseEvent) => {
    if (![2].includes(mouseEvent.button)) {
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
    }
  });

  window.addEventListener('auxclick', (mouseEvent) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
  });

  window.electron.receive('ready', (data) => {
    $app = { ...$app, ...data.versions };
    ready = true;
  });

  window.electron.receive('update', (data) => {
    loadingMessage = data.message;
  });

  onMount(() => {
    setTimeout(() => {
      if (!ready) {
        window.electron.send('ready', {});
      }
    }, 1000);
  });
</script>

{#if ready}
  <header class="fixed w-full h-12 flex justify-between items-center px-4 bg-neutral-700">
    <div class="h-full flex items-center gap-4 text-xl">
      {#each pages as pageData}
        <a
          class="h-full flex items-center px-4 box-content border-b-2 border-b-transparent hover:bg-white/10 {$page.url
            .pathname === pageData.path
            ? 'border-b-white'
            : ''}"
          href="{pageData.path}"
        >
          <span>{pageData.name}</span>
        </a>
      {/each}
    </div>
    <div>
      <div><span class="font-light">App Version:</span> {$app.appVersion}</div>
      <div><span class="font-light">Electron Version:</span> {$app.electronVersion}</div>
    </div>
  </header>
  <main class="w-full h-[calc(100%-3rem)] top-12 fixed overflow-auto">
    <slot />
  </main>
{:else}
  <div class="absolute flex flex-col gap-4 text-xl justify-center items-center h-full w-full bg-neutral-800">
    <Loading />
    <span>{loadingMessage}</span>
  </div>
{/if}
