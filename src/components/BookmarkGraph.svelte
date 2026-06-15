<script>
  import { onDestroy, onMount } from 'svelte';
  import cytoscape from 'cytoscape';
  import { buildBookmarkGraph, RELATION_TYPES } from '../lib/graph.js';
  import { showToast } from '../stores/settings.js';

  export let bookmarks = [];

  let graphEl;
  let cy;
  let selectedNode = null;
  let selectedBookmarks = [];
  let expandedNodeIds = new Set();
  let showAllMatches = false;
  let relationFilters = {
    folder: true,
    domain: true,
    topic: true
  };

  $: graph = buildBookmarkGraph(bookmarks, {
    expandedNodeIds,
    relationFilters,
    revealAllBookmarks: showAllMatches
  });

  $: if (cy) {
    renderGraph(graph.elements);
  }

  function cytoscapeStyle() {
    return [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'font-size': 11,
          'font-weight': 700,
          'text-valign': 'center',
          'text-halign': 'center',
          color: '#18202a',
          'text-outline-width': 2,
          'text-outline-color': '#ffffff',
          width: 'mapData(count, 1, 40, 32, 74)',
          height: 'mapData(count, 1, 40, 32, 74)',
          'border-width': 2,
          'border-color': '#ffffff'
        }
      },
      {
        selector: 'node.folder',
        style: {
          shape: 'round-rectangle',
          'background-color': '#2f80ed'
        }
      },
      {
        selector: 'node.domain',
        style: {
          shape: 'ellipse',
          'background-color': '#16a085'
        }
      },
      {
        selector: 'node.topic',
        style: {
          shape: 'hexagon',
          'background-color': '#f2c94c'
        }
      },
      {
        selector: 'node.bookmark',
        style: {
          shape: 'diamond',
          width: 'mapData(visitCount, 0, 20, 20, 42)',
          height: 'mapData(visitCount, 0, 20, 20, 42)',
          'background-color': '#eb5757',
          'font-size': 9,
          'text-wrap': 'wrap',
          'text-max-width': 92
        }
      },
      {
        selector: 'node.expanded',
        style: {
          'border-width': 4,
          'border-color': '#111827'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 5,
          'border-color': '#000000'
        }
      },
      {
        selector: 'edge',
        style: {
          width: 'mapData(weight, 1, 3, 1, 3)',
          'line-color': '#b7c2cf',
          opacity: 0.55,
          'curve-style': 'bezier'
        }
      },
      {
        selector: 'edge.folder',
        style: {
          'line-color': '#2f80ed'
        }
      },
      {
        selector: 'edge.domain',
        style: {
          'line-color': '#16a085'
        }
      },
      {
        selector: 'edge.topic',
        style: {
          'line-color': '#c9a227'
        }
      },
      {
        selector: '.faded',
        style: {
          opacity: 0.18
        }
      },
      {
        selector: '.focused',
        style: {
          opacity: 1
        }
      }
    ];
  }

  function initGraph() {
    cy = cytoscape({
      container: graphEl,
      elements: [],
      style: cytoscapeStyle(),
      minZoom: 0.2,
      maxZoom: 2.5,
      wheelSensitivity: 0.18
    });

    cy.on('tap', 'node', event => {
      selectNode(event.target);
    });

    cy.on('tap', event => {
      if (event.target === cy) {
        clearSelection();
      }
    });

    renderGraph(graph.elements);
  }

  function renderGraph(elements) {
    const selectedId = selectedNode?.id;
    cy.elements().remove();
    cy.add(elements);

    if (selectedId && cy.getElementById(selectedId).length) {
      selectNode(cy.getElementById(selectedId), false);
    } else {
      selectedNode = null;
      selectedBookmarks = [];
    }

    runLayout();
  }

  function runLayout() {
    if (!cy || cy.elements().length === 0) return;

    cy.layout({
      name: 'cose',
      animate: false,
      fit: true,
      padding: 44,
      randomize: true,
      nodeRepulsion: 8500,
      idealEdgeLength: 96,
      edgeElasticity: 90,
      nestingFactor: 1.15,
      numIter: 900
    }).run();
  }

  function selectNode(node, center = true) {
    const data = node.data();
    selectedNode = data;
    selectedBookmarks = data.type === 'bookmark'
      ? bookmarks.filter(bookmark => bookmark.id === data.id.replace('bookmark:', ''))
      : bookmarks.filter(bookmark => data.bookmarkIds?.includes(bookmark.id));

    cy.elements().removeClass('faded focused');
    node.closedNeighborhood().addClass('focused');
    cy.elements().difference(node.closedNeighborhood()).addClass('faded');

    if (center) {
      cy.animate({
        center: { eles: node },
        zoom: Math.max(cy.zoom(), 0.9)
      }, {
        duration: 220
      });
    }
  }

  function clearSelection() {
    selectedNode = null;
    selectedBookmarks = [];
    cy?.elements().removeClass('faded focused');
  }

  function toggleRelation(type) {
    relationFilters = {
      ...relationFilters,
      [type]: !relationFilters[type]
    };
  }

  function toggleExpanded(nodeId) {
    const next = new Set(expandedNodeIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    expandedNodeIds = next;
  }

  function fitGraph() {
    if (!cy || cy.elements().length === 0) return;
    cy.fit(undefined, 44);
  }

  function resetGraph() {
    expandedNodeIds = new Set();
    showAllMatches = false;
    clearSelection();
  }

  function openBookmark(bookmark) {
    chrome.tabs.create({ url: bookmark.url });
    showToast(`Opened "${bookmark.title || bookmark.url}"`);
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  onMount(() => {
    initGraph();
  });

  onDestroy(() => {
    cy?.destroy();
  });
</script>

<section class="graph-wrapper">
  <div class="graph-toolbar" aria-label="Graph controls">
    <div class="metrics">
      <span><strong>{graph.summary.totalBookmarks}</strong> bookmarks</span>
      <span><strong>{graph.summary.folders}</strong> folders</span>
      <span><strong>{graph.summary.domains}</strong> domains</span>
      <span><strong>{graph.summary.topics}</strong> topics</span>
      <span><strong>{graph.summary.bookmarks}</strong> visible</span>
      {#if graph.summary.hiddenBookmarks > 0}
        <span><strong>{graph.summary.hiddenBookmarks}</strong> hidden</span>
      {/if}
    </div>

    <div class="relation-controls" aria-label="Relation filters">
      {#each RELATION_TYPES as relation}
        <button
          type="button"
          class:active={relationFilters[relation.id]}
          on:click={() => toggleRelation(relation.id)}
        >
          {relation.label}
        </button>
      {/each}
    </div>

    <div class="graph-actions">
      <label class="show-all">
        <input type="checkbox" bind:checked={showAllMatches} />
        <span>Show bookmarks</span>
      </label>
      <button type="button" on:click={fitGraph}>Fit</button>
      <button type="button" on:click={resetGraph}>Reset</button>
    </div>
  </div>

  <div class="graph-layout">
    <div class="canvas-panel">
      {#if graph.elements.length === 0}
        <div class="empty-graph">
          <strong>No graph data</strong>
          <span>Enable at least one relation type to build the graph.</span>
        </div>
      {/if}
      <div bind:this={graphEl} class="graph-canvas" aria-label="Bookmark relationship graph"></div>
    </div>

    <aside class="detail-panel" aria-label="Selected graph node">
      {#if selectedNode}
        <div class="node-heading">
          <span class="node-type">{selectedNode.type}</span>
          <h2>{selectedNode.fullLabel || selectedNode.label}</h2>
        </div>

        {#if selectedNode.type === 'bookmark'}
          {#each selectedBookmarks as bookmark}
            <div class="bookmark-detail">
              <p>{bookmark.url}</p>
              <dl>
                <div>
                  <dt>Folder</dt>
                  <dd>{bookmark.path}</dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd>{formatDate(bookmark.dateAdded)}</dd>
                </div>
                <div>
                  <dt>Visits</dt>
                  <dd>{bookmark.visitCount || 0}</dd>
                </div>
              </dl>
              <button type="button" class="primary-action" on:click={() => openBookmark(bookmark)}>
                Open bookmark
              </button>
            </div>
          {/each}
        {:else}
          <div class="cluster-summary">
            <span>{selectedNode.count} linked bookmarks</span>
            <span>{selectedNode.visitCount || 0} recorded visits</span>
          </div>

          <button type="button" class="primary-action" on:click={() => toggleExpanded(selectedNode.id)}>
            {expandedNodeIds.has(selectedNode.id) ? 'Collapse bookmarks' : 'Expand bookmarks'}
          </button>

          <div class="linked-list">
            {#each selectedBookmarks.slice(0, 12) as bookmark}
              <button type="button" on:click={() => openBookmark(bookmark)}>
                <span>{bookmark.title || bookmark.url}</span>
                <small>{getHostname(bookmark.url)}</small>
              </button>
            {/each}
            {#if selectedBookmarks.length > 12}
              <p>{selectedBookmarks.length - 12} more hidden in this cluster.</p>
            {/if}
          </div>
        {/if}
      {:else}
        <div class="empty-detail">
          <span class="node-type">graph</span>
          <h2>Explore clusters</h2>
          <p>Click a folder, domain, or topic node to inspect its bookmarks. Expand a cluster when you need the individual pages in the graph.</p>
        </div>
      {/if}
    </aside>
  </div>
</section>

<style>
  .graph-wrapper {
    padding: 0 24px 24px;
  }

  .graph-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .metrics {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .metrics strong {
    color: var(--text-primary);
  }

  .relation-controls,
  .graph-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .relation-controls {
    margin-left: auto;
  }

  .relation-controls button,
  .graph-actions button {
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .relation-controls button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  .show-all {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .show-all input {
    accent-color: var(--accent);
  }

  .graph-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 12px;
    align-items: stretch;
  }

  .canvas-panel {
    position: relative;
    min-height: 600px;
    overflow: hidden;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px),
      linear-gradient(color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px),
      var(--surface-elevated);
    background-size: 32px 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .graph-canvas {
    position: absolute;
    inset: 0;
  }

  .empty-graph {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .empty-graph strong {
    color: var(--text-primary);
  }

  .detail-panel {
    min-height: 600px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    overflow: auto;
  }

  .node-heading,
  .empty-detail {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .node-type {
    display: inline-flex;
    align-self: flex-start;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 800;
    color: var(--accent);
    background: var(--accent-bg);
    border-radius: 999px;
    padding: 3px 8px;
  }

  h2 {
    font-size: 18px;
    line-height: 1.25;
    color: var(--text-primary);
    overflow-wrap: anywhere;
  }

  .empty-detail p,
  .bookmark-detail p,
  .linked-list p {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.45;
  }

  .cluster-summary {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 16px 0;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .primary-action {
    width: 100%;
    border: none;
    background: var(--accent);
    color: white;
    border-radius: 7px;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .bookmark-detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 14px;
  }

  dl {
    display: grid;
    gap: 10px;
  }

  dl div {
    display: grid;
    gap: 2px;
  }

  dt {
    color: var(--text-tertiary);
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 800;
  }

  dd {
    color: var(--text-secondary);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .linked-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
  }

  .linked-list button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    color: var(--text-primary);
    border-radius: 7px;
    padding: 9px 10px;
    cursor: pointer;
    text-align: left;
  }

  .linked-list span {
    width: 100%;
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .linked-list small {
    width: 100%;
    color: var(--text-tertiary);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 860px) {
    .graph-layout {
      grid-template-columns: 1fr;
    }

    .canvas-panel,
    .detail-panel {
      min-height: 420px;
    }

    .relation-controls {
      margin-left: 0;
    }
  }
</style>
