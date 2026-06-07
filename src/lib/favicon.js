/**
 * Generate a deterministic color from a string (for letter avatars).
 */
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

/**
 * Get favicon URL for a bookmark.
 * Uses Google's favicon service as fallback.
 */
export function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

/**
 * Extract first meaningful character for letter avatar.
 */
export function getInitial(title) {
  if (!title) return '?';
  const trimmed = title.trim();
  if (!trimmed) return '?';
  // For CJK characters, use the first character directly
  return trimmed[0].toUpperCase();
}
