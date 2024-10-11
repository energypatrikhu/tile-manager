<script lang="ts">
  export let multiple = false;
  export let files: Array<AppFile> = [];

  $: message =
    files.length === 0 ? 'none' : files.length > 1 ? `${files.length} file${files.length > 1 ? 's' : ''}` : files[0].name;

  window.electron.receive('selectFile', (selectedFiles) => (files = selectedFiles));
  function selectFile() {
    window.electron.send('selectFile', { isMultiple: multiple });
  }
</script>

<div class="flex w-fit justify-center items-center gap-2">
  <button
    class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded w-32"
    on:click="{selectFile}">Select file{multiple ? 's' : ''}</button
  >

  <span>Selected{multiple ? ':' : ' file:'} <span class="font-thin">{message}</span></span>
</div>
