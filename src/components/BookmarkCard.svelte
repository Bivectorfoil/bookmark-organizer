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

<div class="card">
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="card-header" on:click={open} role="button" tabindex="0">
    {#if !faviconFailed && faviconUrl}
      <img
        src={faviconUrl}
        alt=""
        class="favicon"
        on:error={onFaviconError}
        width="20"
        height="20"
      />
    {:else}
      <div class="letter-avatar" style="background: {bgColor}">
        {initial}
      </div>
    {/if}

    {#if editing}
      <input
        class="edit-input"
        bind:value={editTitle}
        on:keydown={e => e.key === 'Enter' && confirmRename()}
        on:keydown={e => e.key === 'Escape' && cancelRename()}
        on:blur={confirmRename}
      />
    {:else}
      <span class="title">{bookmark.title || '（无标题）'}</span>
    {/if}
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="card-url" on:click={open} role="button" tabindex="0">
    <span class="url-text">{bookmark.url}</span>
  </div>

  {#if bookmark.dateAdded}
    <div class="card-meta">
      添加于 {formatDate(bookmark.dateAdded)}
      {#if bookmark.visitCount > 0}
        · 访问 {bookmark.visitCount} 次
      {/if}
    </div>
  {/if}

  <div class="card-actions">
    <button class="action-btn" on:click={startRename} title="重命名">✏️</button>
    <button class="action-btn" on:click={openMoveDialog} title="移动">📁</button>
    <button class="action-btn danger" on:click={deleteBookmark} title="删除">🗑️</button>
  </div>
</div>

<style>
  .card {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: box-shadow 0.2s, transform 0.15s;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .favicon {
    border-radius: 4px;
    flex-shrink: 0;
  }

  .letter-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-input {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 4px;
    padding: 2px 6px;
    width: 100%;
    outline: none;
  }

  .card-url {
    cursor: pointer;
  }

  .url-text {
    font-size: 12px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }

  .card-meta {
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .card:hover .card-actions {
    opacity: 1;
  }

  .action-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 8px;
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
