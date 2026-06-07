<script>
  import { onMount } from 'svelte';
  import {
    bookmarks,
    byCategory,
    byYear,
    byMonth,
    recentlyOpened,
    newlyAdded,
    loading,
    error,
    loadBookmarks
  } from './stores/bookmarks.js';
  import { viewMode, sortMode, searchQuery } from './stores/settings.js';
  import Toolbar from './components/Toolbar.svelte';
  import BookmarkGrid from './components/BookmarkGrid.svelte';
  import BookmarkList from './components/BookmarkList.svelte';
  import FolderPicker from './components/FolderPicker.svelte';
  import Toast from './components/Toast.svelte';

  onMount(() => {
    loadBookmarks();
  });

  // Format month key "YYYY-MM" to display string
  function formatMonth(key) {
    const [y, m] = key.split('-');
    return `${y}年${parseInt(m)}月`;
  }

  // Filter bookmarks by search query
  function filterBookmarks(list, query) {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(bm =>
      bm.title.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q)
    );
  }

  // Reactive: compute the current view data
  $: filteredBookmarks = filterBookmarks($bookmarks, $searchQuery);

  $: currentGroups = (() => {
    const q = $searchQuery;
    switch ($sortMode) {
      case 'category': {
        const groups = {};
        for (const [key, items] of Object.entries($byCategory)) {
          const filtered = filterBookmarks(items, q);
          if (filtered.length > 0) groups[key] = filtered;
        }
        return groups;
      }
      case 'year': {
        const groups = {};
        for (const [key, items] of Object.entries($byYear)) {
          const filtered = filterBookmarks(items, q);
          if (filtered.length > 0) groups[key] = filtered;
        }
        return groups;
      }
      case 'month': {
        const groups = {};
        const labels = {};
        for (const [key, items] of Object.entries($byMonth)) {
          const filtered = filterBookmarks(items, q);
          if (filtered.length > 0) {
            groups[key] = filtered;
            labels[key] = formatMonth(key);
          }
        }
        return { groups, labels };
      }
      case 'recent':
        return { list: filterBookmarks($recentlyOpened, q) };
      case 'new':
        return { list: filterBookmarks($newlyAdded, q) };
      default:
        return { list: filteredBookmarks };
    }
  })();

  $: isGrouped = $sortMode === 'category' || $sortMode === 'year' || $sortMode === 'month';
  $: displayGroups = isGrouped ? ($sortMode === 'month' ? currentGroups.groups : currentGroups) : null;
  $: displayLabels = $sortMode === 'month' ? currentGroups.labels : null;
  $: displayList = !isGrouped ? currentGroups.list : null;
</script>

<main class="app">
  <header class="app-header">
    <h1 class="app-title">📑 书签整理器</h1>
    <span class="bookmark-count">{$bookmarks.length} 个书签</span>
  </header>

  <Toolbar />

  {#if $loading}
    <div class="status">
      <div class="spinner"></div>
      <p>加载书签中...</p>
    </div>
  {:else if $error}
    <div class="status error">
      <p>⚠️ {$error}</p>
      <button on:click={loadBookmarks}>重试</button>
    </div>
  {:else if filteredBookmarks.length === 0}
    <div class="status">
      <p>{ $searchQuery ? '没有匹配的书签。' : '未找到书签。' }</p>
    </div>
  {:else}
    {#if $viewMode === 'grid'}
      {#if isGrouped}
        <BookmarkGrid groups={displayGroups} groupLabels={displayLabels} />
      {:else}
        <BookmarkGrid bookmarks={displayList} />
      {/if}
    {:else}
      {#if isGrouped}
        <BookmarkList groups={displayGroups} groupLabels={displayLabels} />
      {:else}
        <BookmarkList bookmarks={displayList} />
      {/if}
    {/if}
  {/if}

  <FolderPicker />
  <Toast />
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
  }

  :global(:root) {
    --bg: #f5f5f7;
    --surface: #ffffff;
    --surface-elevated: #f9f9fb;
    --border: #e5e5ea;
    --text-primary: #1d1d1f;
    --text-secondary: #6e6e73;
    --text-tertiary: #aeaeb2;
    --accent: #007aff;
    --accent-bg: rgba(0, 122, 255, 0.08);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #1c1c1e;
      --surface: #2c2c2e;
      --surface-elevated: #3a3a3c;
      --border: #48484a;
      --text-primary: #f5f5f7;
      --text-secondary: #a1a1a6;
      --text-tertiary: #6e6e73;
      --accent: #0a84ff;
      --accent-bg: rgba(10, 132, 255, 0.12);
    }
  }

  .app {
    min-height: 100vh;
  }

  .app-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 20px 24px 0 24px;
  }

  .app-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .bookmark-count {
    font-size: 14px;
    color: var(--text-tertiary);
  }

  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    color: var(--text-secondary);
    gap: 16px;
  }

  .status.error {
    color: #ff3b30;
  }

  .status button {
    padding: 8px 20px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-primary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
