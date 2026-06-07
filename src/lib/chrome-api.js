/**
 * Chrome API wrapper for bookmarks, history, and storage.
 * All functions return Promises for async/await usage.
 */

// ── Bookmarks ──────────────────────────────────────────────

export async function getBookmarkTree() {
  return new Promise(resolve => {
    chrome.bookmarks.getTree(resolve);
  });
}

export async function getRecentBookmarks(limit = 50) {
  return new Promise(resolve => {
    chrome.bookmarks.getRecent(limit, resolve);
  });
}

export async function searchBookmarks(query) {
  return new Promise(resolve => {
    chrome.bookmarks.search(query, resolve);
  });
}

export async function createBookmark(bookmark) {
  return new Promise(resolve => {
    chrome.bookmarks.create(bookmark, resolve);
  });
}

export async function updateBookmark(id, changes) {
  return new Promise(resolve => {
    chrome.bookmarks.update(id, changes, resolve);
  });
}

export async function removeBookmark(id) {
  return new Promise(resolve => {
    chrome.bookmarks.remove(id, resolve);
  });
}

export async function moveBookmark(id, destination) {
  return new Promise(resolve => {
    chrome.bookmarks.move(id, destination, resolve);
  });
}

// ── History ────────────────────────────────────────────────

export async function getHistoryVisits(url) {
  return new Promise(resolve => {
    chrome.history.getVisits({ url }, resolve);
  });
}

export async function searchHistory(query, maxResults = 1000) {
  return new Promise(resolve => {
    chrome.history.search({ text: query, maxResults, startTime: 0 }, resolve);
  });
}

// ── Storage ────────────────────────────────────────────────

export async function getStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, resolve);
  });
}

export async function setStorage(data) {
  return new Promise(resolve => {
    chrome.storage.local.set(data, resolve);
  });
}

// ── Utility: Flatten bookmark tree ─────────────────────────

export function flattenBookmarks(nodes, parentPath = '') {
  const result = [];
  for (const node of nodes) {
    const path = node.title ? (parentPath ? `${parentPath} / ${node.title}` : node.title) : parentPath;
    if (node.url) {
      result.push({
        id: node.id,
        title: node.title || '',
        url: node.url,
        dateAdded: node.dateAdded,
        parentId: node.parentId,
        path
      });
    }
    if (node.children) {
      result.push(...flattenBookmarks(node.children, path));
    }
  }
  return result;
}

// ── Utility: Get folders from tree ─────────────────────────

export function getFolders(nodes, parentPath = '', depth = 0) {
  const result = [];
  for (const node of nodes) {
    if (node.children) {
      const path = node.title ? (parentPath ? `${parentPath} / ${node.title}` : node.title) : parentPath;
      result.push({
        id: node.id,
        title: node.title || (depth === 0 ? 'Bookmarks Bar' : 'Untitled'),
        path,
        depth
      });
      result.push(...getFolders(node.children, path, depth + 1));
    }
  }
  return result;
}

// ── Utility: Enrich bookmarks with history data ────────────

export async function enrichWithHistory(bookmarks) {
  const urlVisitMap = new Map();

  // Batch query history for all bookmark URLs
  const historyPromises = bookmarks.map(async bm => {
    try {
      const visits = await getHistoryVisits(bm.url);
      return { id: bm.id, visits: visits.length, lastVisit: visits.length > 0 ? Math.max(...visits.map(v => v.visitTime)) : 0 };
    } catch {
      return { id: bm.id, visits: 0, lastVisit: 0 };
    }
  });

  const historyResults = await Promise.all(historyPromises);
  for (const h of historyResults) {
    urlVisitMap.set(h.id, { visits: h.visits, lastVisit: h.lastVisit });
  }

  return bookmarks.map(bm => {
    const hist = urlVisitMap.get(bm.id) || { visits: 0, lastVisit: 0 };
    return { ...bm, visitCount: hist.visits, lastVisited: hist.lastVisit };
  });
}
