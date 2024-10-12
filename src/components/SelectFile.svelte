<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';

  export let multiple = false;
  export let files: Array<AppFile> = [];

  let transactionId: string;

  $: message =
    files.length === 0 ? 'none' : files.length > 1 ? `${files.length} file${files.length > 1 ? 's' : ''}` : files[0].name;

  window.electron.receive('selectFile', (selectedFiles) => {
    if (selectedFiles.transactionId !== transactionId) return;
    files = selectedFiles.files;
  });
  function selectFile() {
    transactionId = uuidv4();
    window.electron.send('selectFile', { isMultiple: multiple, transactionId });
  }
</script>

<div class="flex w-fit justify-center items-center gap-2">
  <button
    class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded w-32"
    on:click="{selectFile}">Select file{multiple ? 's' : ''}</button
  >

  <span>Selected{multiple ? ':' : ' file:'} <span class="font-thin">{message}</span></span>
</div>
