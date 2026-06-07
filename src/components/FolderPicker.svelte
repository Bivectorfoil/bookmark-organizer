<script>
  import { folderPickerOpen, folderPickerBookmarkId, showToast } from '../stores/settings.js';
  import { folders, loadBookmarks } from '../stores/bookmarks.js';

  let selectedFolderId = null;

  function close() {
    folderPickerOpen.set(false);
    folderPickerBookmarkId.set(null);
    selectedFolderId = null;
  }

  async function confirmMove() {
    if (!selectedFolderId || !$folderPickerBookmarkId) return;
    try {
      await chrome.bookmarks.move($folderPickerBookmarkId, { parentId: selectedFolderId });
      showToast('📁 书签已移动');
      await loadBookmarks();
    } catch (e) {
      showToast(`错误：${e.message}`);
    }
    close();
  }

  function selectFolder(id) {
    selectedFolderId = id;
  }
</script>

{#if $folderPickerOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions a11y-no-noninteractive-element-to-interactive-role -->
  <div class="overlay" on:click={close} role="dialog" aria-modal="true" on:keydown={e => e.key === 'Escape' && close()}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions a11y-no-static-element-interactions -->
    <div class="dialog" on:click|stopPropagation role="document">
      <div class="dialog-header">
        <h3>移动到文件夹</h3>
        <button class="close-btn" on:click={close}>✕</button>
      </div>

      <div class="folder-list" role="listbox">
        {#each $folders as folder (folder.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
          <div
            class="folder-item"
            class:selected={selectedFolderId === folder.id}
            on:click={() => selectFolder(folder.id)}
            style="padding-left: {folder.depth * 20 + 12}px"
            role="option"
            aria-selected={selectedFolderId === folder.id}
            tabindex="0"
            on:keydown={e => e.key === 'Enter' && selectFolder(folder.id)}
          >
            <span class="folder-icon">📂</span>
            <span class="folder-name">{folder.title}</span>
          </div>
        {/each}
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" on:click={close}>取消</button>
        <button
          class="btn btn-primary"
          disabled={!selectedFolderId}
          on:click={confirmMove}
        >
          移动
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dialog {
    background: var(--surface);
    border-radius: 12px;
    width: 90%;
    max-width: 480px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 16px;
    color: var(--text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: var(--surface-elevated);
  }

  .folder-list {
    overflow-y: auto;
    flex: 1;
    padding: 8px 0;
  }

  .folder-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .folder-item:hover {
    background: var(--surface-elevated);
  }

  .folder-item.selected {
    background: var(--accent-bg);
    border-left: 3px solid var(--accent);
  }

  .folder-icon {
    font-size: 16px;
  }

  .folder-name {
    font-size: 14px;
    color: var(--text-primary);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }

  .btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid var(--border);
    transition: all 0.15s;
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: var(--surface-elevated);
  }

  .btn-primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }
</style>
