<script>
  import { viewMode, sortMode, searchQuery, showToast } from '../stores/settings.js';
  import { bookmarks } from '../stores/bookmarks.js';

  let debounceTimer;

  function onSearchInput(e) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery.set(e.target.value);
    }, 200);
  }

  function pickRandom() {
    const all = [...$bookmarks];
    if (all.length === 0) return;
    const pick = all[Math.floor(Math.random() * all.length)];
    chrome.tabs.create({ url: pick.url });
    showToast(`🎲 已打开「${pick.title || pick.url}」`);
  }

  const sortOptions = [
    { value: 'category', label: '📂 分类' },
    { value: 'year', label: '📅 年份' },
    { value: 'month', label: '🗓️ 月份' },
    { value: 'recent', label: '⏰ 最近常看' },
    { value: 'new', label: '🆕 新增' }
  ];
</script>

<div class="toolbar">
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder="搜索书签..."
      on:input={onSearchInput}
    />
  </div>

  <div class="sort-tabs">
    {#each sortOptions as opt}
      <button
        class="tab"
        class:active={$sortMode === opt.value}
        on:click={() => sortMode.set(opt.value)}
      >
        {opt.label}
      </button>
    {/each}
  </div>

  <div class="actions">
    <button class="random-btn" on:click={pickRandom} title="随机打开一个书签">
      🎲 随机
    </button>

    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:active={$viewMode === 'grid'}
        on:click={() => viewMode.set('grid')}
        title="卡片视图"
      >
        ▦
      </button>
      <button
        class="toggle-btn"
        class:active={$viewMode === 'list'}
        on:click={() => viewMode.set('list')}
        title="列表视图"
      >
        ☰
      </button>
    </div>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .search-box {
    display: flex;
    align-items: center;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 12px;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
  }

  .search-icon {
    font-size: 14px;
    margin-right: 8px;
    opacity: 0.6;
  }

  .search-box input {
    border: none;
    background: transparent;
    padding: 10px 0;
    font-size: 14px;
    width: 100%;
    color: var(--text-primary);
    outline: none;
  }

  .search-box input::placeholder {
    color: var(--text-tertiary);
  }

  .sort-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tab {
    padding: 6px 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .tab:hover {
    background: var(--surface-elevated);
  }

  .tab.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }

  .random-btn {
    padding: 8px 16px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: transform 0.1s, box-shadow 0.15s;
  }

  .random-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .random-btn:active {
    transform: translateY(0);
  }

  .view-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  .toggle-btn {
    padding: 6px 12px;
    background: var(--surface);
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--text-secondary);
    transition: background 0.15s;
  }

  .toggle-btn:first-child {
    border-right: 1px solid var(--border);
  }

  .toggle-btn.active {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .toggle-btn:hover:not(.active) {
    background: var(--surface-elevated);
  }
</style>
