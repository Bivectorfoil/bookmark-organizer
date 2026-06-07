<script>
  import { getFaviconUrl, getInitial, stringToColor } from '../lib/favicon.js';
  import { showToast, folderPickerOpen, folderPickerBookmarkId } from '../stores/settings.js';
  import { loadBookmarks } from '../stores/bookmarks.js';

  export let bookmark;

  let faviconFailed = false;
  let faviconUrl = getFaviconUrl(bookmark.url);
  let editing = false;
  let editTitle = bookmark.title;

  function onFaviconError() {
    faviconFailed = true;
  }

  function open() {
    chrome.tabs.create({ url: bookmark.url });
  }

  async function deleteBookmark() {
    if (!confirm(`确定删除「${bookmark.title || bookmark.url}」？`)) return;
    try {
      await chrome.bookmarks.remove(bookmark.id);
      showToast(`🗑️ 已删除「${bookmark.title || bookmark.url}」`);
      await loadBookmarks();
    } catch (e) {
      showToast(`错误：${e.message}`);
    }
  }

  function startRename() {
    editTitle = bookmark.title;
    editing = true;
  }

  async function confirmRename() {
    if (editTitle !== bookmark.title) {
      try {
        await chrome.bookmarks.update(bookmark.id, { title: editTitle });
        showToast(`✏️ 已重命名为「${editTitle}」`);
        await loadBookmarks();
      } catch (e) {
        showToast(`错误：${e.message}`);
      }
    }
    editing = false;
  }

  function cancelRename() {
    editing = false;
  }

  function openMoveDialog() {
    folderPickerBookmarkId.set(bookmark.id);
    folderPickerOpen.set(true);
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString();
  }

  $: initial = getInitial(bookmark.title);
  $: bgColor = stringToColor(bookmark.url);
</script>

<div class="list-item">
  <div class="item-favicon">
    {#if !faviconFailed && faviconUrl}
      <img src={faviconUrl} alt="" class="favicon" on:error={onFaviconError} width="18" height="18" />
    {:else}
      <div class="letter-avatar" style="background: {bgColor}">{initial}</div>
    {/if}
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="item-main" on:click={open} role="button" tabindex="0">
    {#if editing}
      <input
        class="edit-input"
        bind:value={editTitle}
        on:keydown={e => e.key === 'Enter' && confirmRename()}
        on:keydown={e => e.key === 'Escape' && cancelRename()}
        on:blur={confirmRename}
      />
    {:else}
      <span class="item-title">{bookmark.title || '（无标题）'}</span>
    {/if}
    <span class="item-url">{bookmark.url}</span>
  </div>

  <div class="item-meta">
    {formatDate(bookmark.dateAdded)}
    {#if bookmark.visitCount > 0}
      <span class="visit-count">{bookmark.visitCount}x</span>
    {/if}
  </div>

  <div class="item-actions">
    <button class="action-btn" on:click|stopPropagation={startRename} title="重命名">✏️</button>
    <button class="action-btn" on:click|stopPropagation={openMoveDialog} title="移动">📁</button>
    <button class="action-btn danger" on:click|stopPropagation={deleteBookmark} title="删除">🗑️</button>
  </div>
</div>

<style>
  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }

  .list-item:hover {
    background: var(--surface-elevated);
  }

  .item-favicon {
    flex-shrink: 0;
  }

  .favicon {
    border-radius: 3px;
  }

  .letter-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 11px;
    font-weight: 700;
  }

  .item-main {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-input {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 4px;
    padding: 2px 6px;
    width: 100%;
    outline: none;
  }

  .item-url {
    font-size: 12px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    font-size: 12px;
    color: var(--text-tertiary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .visit-count {
    background: var(--surface);
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 11px;
    margin-left: 4px;
  }

  .item-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  .list-item:hover .item-actions {
    opacity: 1;
  }

  .action-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 6px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;
  }

  .action-btn:hover {
    background: var(--surface);
  }

  .action-btn.danger:hover {
    background: #fee;
    border-color: #fcc;
  }
</style>
