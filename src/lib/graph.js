const STOPWORDS = new Set([
  'www',
  'com',
  'org',
  'net',
  'html',
  'http',
  'https',
  'github',
  'docs',
  'blog',
  'news',
  'login',
  'sign',
  'home',
  'index',
  'page',
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'your',
  'you',
  'how',
  'what',
  'why',
  'api',
  'app'
]);

const NODE_LIMITS = {
  folder: 18,
  domain: 24,
  topic: 28
};
const BOOKMARK_NODE_LIMIT = 180;

export const RELATION_TYPES = [
  { id: 'folder', label: 'Folders' },
  { id: 'domain', label: 'Domains' },
  { id: 'topic', label: 'Topics' }
];

function normalizeDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch {
    return 'invalid-url';
  }
}

function getFolderPath(bookmark) {
  return bookmark.path?.split(' / ').slice(0, -1).join(' / ') || 'Root';
}

function getFolderLabel(path) {
  return path.split(' / ').filter(Boolean).at(-1) || 'Root';
}

function addToCluster(map, key, bookmark) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(bookmark);
}

function trimLabel(label, max = 24) {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}...`;
}

function tokenizeBookmark(bookmark) {
  const domain = normalizeDomain(bookmark.url).replaceAll('.', ' ');
  const urlPath = safeUrlPath(bookmark.url);
  const text = `${bookmark.title || ''} ${domain} ${urlPath}`.toLowerCase();
  const tokens = text.match(/[\p{Script=Han}]{2,8}|[a-z0-9][a-z0-9-]{2,}/gu) || [];

  return [...new Set(tokens)]
    .map(token => token.replace(/^-+|-+$/g, ''))
    .filter(token => token.length >= 3 || /[\p{Script=Han}]/u.test(token))
    .filter(token => !STOPWORDS.has(token))
    .slice(0, 8);
}

function safeUrlPath(url) {
  try {
    return new URL(url).pathname.replace(/[/_-]+/g, ' ');
  } catch {
    return '';
  }
}

function rankClusters(entries) {
  return entries
    .filter(([, items]) => items.length > 0)
    .sort(([, a], [, b]) => {
      const visits = sumVisits(b) - sumVisits(a);
      return visits || b.length - a.length;
    });
}

function sumVisits(items) {
  return items.reduce((sum, bookmark) => sum + (bookmark.visitCount || 0), 0);
}

function rankBookmarks(bookmarks) {
  return [...bookmarks].sort((a, b) => {
    const visits = (b.visitCount || 0) - (a.visitCount || 0);
    const visited = (b.lastVisited || 0) - (a.lastVisited || 0);
    const added = (b.dateAdded || 0) - (a.dateAdded || 0);
    return visits || visited || added;
  });
}

function buildClusterNodes(type, clusters, limit) {
  return rankClusters([...clusters.entries()])
    .slice(0, limit)
    .map(([key, items]) => ({
      id: `${type}:${key}`,
      label: type === 'folder' ? getFolderLabel(key) : key,
      fullLabel: key,
      type,
      count: items.length,
      visitCount: sumVisits(items),
      bookmarkIds: items.map(item => item.id)
    }));
}

function hasEnabledRelation(node, relationFilters) {
  return relationFilters[node.type] !== false;
}

function shouldRevealBookmark(bookmark, clusterNodes, expandedNodeIds, revealAll) {
  if (revealAll) return true;

  return clusterNodes.some(node =>
    expandedNodeIds.has(node.id) && node.bookmarkIds.includes(bookmark.id)
  );
}

export function buildBookmarkGraph(bookmarks, options = {}) {
  const {
    expandedNodeIds = new Set(),
    relationFilters = {},
    revealAllBookmarks = false
  } = options;

  const folderClusters = new Map();
  const domainClusters = new Map();
  const topicClusters = new Map();

  for (const bookmark of bookmarks) {
    addToCluster(folderClusters, getFolderPath(bookmark), bookmark);
    addToCluster(domainClusters, normalizeDomain(bookmark.url), bookmark);

    for (const topic of tokenizeBookmark(bookmark)) {
      addToCluster(topicClusters, topic, bookmark);
    }
  }

  const folderNodes = buildClusterNodes('folder', folderClusters, NODE_LIMITS.folder);
  const domainNodes = buildClusterNodes('domain', domainClusters, NODE_LIMITS.domain);
  const topicNodes = buildClusterNodes('topic', topicClusters, NODE_LIMITS.topic)
    .filter(node => node.count > 1);
  const clusterNodes = [...folderNodes, ...domainNodes, ...topicNodes]
    .filter(node => hasEnabledRelation(node, relationFilters));

  const revealBookmarks = revealAllBookmarks || bookmarks.length <= 18;
  const candidateBookmarks = bookmarks.filter(bookmark =>
    shouldRevealBookmark(bookmark, clusterNodes, expandedNodeIds, revealBookmarks)
  );
  const visibleBookmarks = rankBookmarks(candidateBookmarks).slice(0, BOOKMARK_NODE_LIMIT);

  const nodes = [
    ...clusterNodes.map(node => ({
      data: {
        ...node,
        label: trimLabel(node.label),
        expanded: expandedNodeIds.has(node.id)
      },
      classes: `${node.type} aggregate${expandedNodeIds.has(node.id) ? ' expanded' : ''}`
    })),
    ...visibleBookmarks.map(bookmark => ({
      data: {
        id: `bookmark:${bookmark.id}`,
        label: trimLabel(bookmark.title || normalizeDomain(bookmark.url), 32),
        fullLabel: bookmark.title || bookmark.url,
        type: 'bookmark',
        count: 1,
        url: bookmark.url,
        path: bookmark.path,
        dateAdded: bookmark.dateAdded,
        visitCount: bookmark.visitCount || 0,
        lastVisited: bookmark.lastVisited || 0
      },
      classes: 'bookmark'
    }))
  ];

  const visibleBookmarkIds = new Set(visibleBookmarks.map(bookmark => bookmark.id));
  const edges = [];

  for (const cluster of clusterNodes) {
    for (const bookmarkId of cluster.bookmarkIds) {
      if (!visibleBookmarkIds.has(bookmarkId)) continue;
      edges.push({
        data: {
          id: `${cluster.id}->bookmark:${bookmarkId}`,
          source: cluster.id,
          target: `bookmark:${bookmarkId}`,
          type: cluster.type,
          weight: cluster.type === 'folder' ? 2 : 1
        },
        classes: cluster.type
      });
    }
  }

  return {
    elements: [...nodes, ...edges],
    summary: {
      folders: folderNodes.length,
      domains: domainNodes.length,
      topics: topicNodes.length,
      bookmarks: visibleBookmarks.length,
      hiddenBookmarks: Math.max(candidateBookmarks.length - visibleBookmarks.length, 0),
      totalBookmarks: bookmarks.length
    },
    clusters: clusterNodes
  };
}
