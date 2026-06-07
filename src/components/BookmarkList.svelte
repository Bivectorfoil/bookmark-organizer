<script>
  import BookmarkListItem from './BookmarkListItem.svelte';
  import GroupHeader from './GroupHeader.svelte';

  export let bookmarks = [];
  export let groups = null;
  export let groupLabels = null;
</script>

<div class="list-wrapper">
  {#if groups}
    {#each Object.entries(groups) as [key, items]}
      <GroupHeader title={groupLabels?.[key] ?? key} count={items.length} />
      <div class="list">
        {#each items as bm (bm.id)}
          <BookmarkListItem bookmark={bm} />
        {/each}
      </div>
    {/each}
  {:else}
    <div class="list">
      {#each bookmarks as bm (bm.id)}
        <BookmarkListItem bookmark={bm} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .list-wrapper {
    padding: 0 24px 24px 24px;
  }

  .list {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
</style>
