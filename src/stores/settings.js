import { writable } from 'svelte/store';

// View mode: 'grid' | 'list'
export const viewMode = writable('grid');

// Sort/group mode: 'category' | 'year' | 'month' | 'recent' | 'new'
export const sortMode = writable('category');

// Search query
export const searchQuery = writable('');

// Toast notifications
export const toasts = writable([]);

let toastId = 0;

export function showToast(message, duration = 3000) {
  const id = ++toastId;
  toasts.update(t => [...t, { id, message }]);
  setTimeout(() => {
    toasts.update(t => t.filter(item => item.id !== id));
  }, duration);
}

// Folder picker state
export const folderPickerOpen = writable(false);
export const folderPickerBookmarkId = writable(null);
