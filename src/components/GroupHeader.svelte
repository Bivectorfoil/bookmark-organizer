<script>
  export let title;
  export let count = 0;
</script>

<div class="group-header">
  <span class="group-title">{title}</span>
  <span class="group-count">{count}</span>
</div>

<style>
  .group-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0 8px 0;
    margin-top: 8px;
  }

  .group-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .group-count {
    font-size: 12px;
    color: var(--text-tertiary);
    background: var(--surface-elevated);
    padding: 2px 8px;
    border-radius: 10px;
  }
</style>
