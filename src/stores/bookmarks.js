import { writable, derived } from 'svelte/store';
import {
  getBookmarkTree,
  flattenBookmarks,
  getFolders,
  enrichWithHistory
} from '../lib/chrome-api.js';

// ── Raw data stores ────────────────────────────────────────

export const bookmarks = writable([]);
export const folders = writable([]);
export const loading = writable(true);
export const error = writable(null);

// ── Load bookmarks from Chrome API ─────────────────────────

export async function loadBookmarks() {
  loading.set(true);
  error.set(null);
  try {
    const tree = await getBookmarkTree();
    const flat = flattenBookmarks(tree);
    const enriched = await enrichWithHistory(flat);
    bookmarks.set(enriched);
    folders.set(getFolders(tree));
  } catch (e) {
    error.set(e.message);
    console.error('Failed to load bookmarks:', e);
  } finally {
    loading.set(false);
  }
}

// ── Derived: by category (folder path) ─────────────────────

export const byCategory = derived(bookmarks, $bm => {
  const groups = {};
  for (const b of $bm) {
    const folder = b.path.split(' / ').slice(0, -1).join(' / ') || 'Root';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(b);
  }
  return groups;
});

// ── Derived: by year ───────────────────────────────────────

export const byYear = derived(bookmarks, $bm => {
  const groups = {};
  for (const b of $bm) {
    const year = b.dateAdded ? new Date(b.dateAdded).getFullYear() : 'Unknown';
    if (!groups[year]) groups[year] = [];
    groups[year].push(b);
  }
  // Sort keys descending
  const sorted = {};
  for (const k of Object.keys(groups).sort((a, b) => b - a)) {
    sorted[k] = groups[k].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  }
  return sorted;
});

// ── Derived: by month ──────────────────────────────────────

export const byMonth = derived(bookmarks, $bm => {
  const groups = {};
  for (const b of $bm) {
    if (!b.dateAdded) {
      if (!groups['Unknown']) groups['Unknown'] = [];
      groups['Unknown'].push(b);
      continue;
    }
    const d = new Date(b.dateAdded);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  const sorted = {};
  for (const k of Object.keys(groups).sort((a, b) => b.localeCompare(a))) {
    sorted[k] = groups[k].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  }
  return sorted;
});

// ── Derived: recently opened (by visit count) ──────────────

export const recentlyOpened = derived(bookmarks, $bm => {
  return [...$bm]
    .filter(b => b.visitCount > 0)
    .sort((a, b) => b.lastVisited - a.lastVisited)
    .slice(0, 30);
});

// ── Derived: newly added ───────────────────────────────────

export const newlyAdded = derived(bookmarks, $bm => {
  return [...$bm]
    .filter(b => b.dateAdded)
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 30);
});
