<script lang="ts">
  import '../app.css';
  import Loading from '$components/Loading.svelte';

  import { onMount } from 'svelte';
  import app from '$stores/app';

  let ready = false;

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

  onMount(() => window.electron.send('ready', {}));
</script>

{#if ready}
  <header class="fixed w-full h-12 flex justify-between items-center px-4 bg-neutral-700">
    <div class="h-full flex items-center justify-center text-3xl">Tile Joiner</div>
    <div>
      <div><span class="font-light">App Version:</span> {$app.appVersion}</div>
      <div><span class="font-light">Electron Version:</span> {$app.electronVersion}</div>
    </div>
  </header>
  <main class="w-full h-[calc(100%-3rem)] top-12 fixed overflow-auto">
    <slot />
  </main>
{:else}
  <div class="absolute flex justify-center items-center h-full w-full">
    <Loading />
  </div>
{/if}
