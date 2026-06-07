<script>
  import BookmarkCard from './BookmarkCard.svelte';
  import GroupHeader from './GroupHeader.svelte';

  export let bookmarks = [];
  export let groups = null; // { [key]: Bookmark[] } if grouped
  export let groupLabels = null; // { [key]: string } optional display labels
</script>

<div class="grid-wrapper">
  {#if groups}
    {#each Object.entries(groups) as [key, items]}
      <GroupHeader title={groupLabels?.[key] ?? key} count={items.length} />
      <div class="grid">
        {#each items as bm (bm.id)}
          <BookmarkCard bookmark={bm} />
        {/each}
      </div>
    {/each}
  {:else}
    <div class="grid">
      {#each bookmarks as bm (bm.id)}
        <BookmarkCard bookmark={bm} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-wrapper {
    padding: 0 24px 24px 24px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
</style>
