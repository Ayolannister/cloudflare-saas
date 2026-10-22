import { FILENAME_PATTERN, MAX_FILE_SIZE } from '../../lib/api';
import { formatBytes } from '../../lib/format';

/** Mirrors the API's checks so people hear about problems before the upload starts. */
export function checkFile(file: File): string | null {
  if (file.size === 0) return `${file.name} is empty. Choose a file with content.`;
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is ${formatBytes(file.size)}. Files can be up to ${formatBytes(MAX_FILE_SIZE)}.`;
  }
  return null;
}

export function checkFilename(name: string): string | null {
  if (!name.trim()) return 'Enter a file name.';
  if (name.length > 255) return 'Keep the file name to 255 characters or fewer.';
  if (name === '.' || name === '..') return 'Choose a different file name.';
  if (!FILENAME_PATTERN.test(name)) return 'Use only letters, numbers, spaces, dots, underscores and hyphens.';
  return null;
}
