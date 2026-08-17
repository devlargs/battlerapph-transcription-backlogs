import manifestJson from '../../data/json/manifest.json';
import type { Manifest, Snapshot } from './types';

export const manifest = manifestJson as Manifest;

/**
 * Each chunk is a separate lazily-loaded module, so a page view only downloads
 * the one file that holds the snapshot being displayed.
 */
const chunkLoaders = import.meta.glob<{ default: Snapshot[] }>(
	'../../data/json/[0-9][0-9][0-9][0-9].json'
);

const cache = new Map<string, Snapshot[]>();

export async function loadChunk(file: string): Promise<Snapshot[]> {
	const cached = cache.get(file);
	if (cached) return cached;

	const key = Object.keys(chunkLoaders).find((path) => path.endsWith(`/${file}`));
	if (!key) throw new Error(`Unknown data chunk: ${file}`);

	const snapshots = (await chunkLoaders[key]()).default;
	cache.set(file, snapshots);
	return snapshots;
}

/**
 * Maps a newest-first index (0 = most recent snapshot) onto the chunk file and
 * the offset inside it. Chunks and their entries are stored oldest-first.
 */
export function locate(indexFromNewest: number): { file: string; offset: number } | null {
	if (indexFromNewest < 0 || indexFromNewest >= manifest.total) return null;

	let remaining = indexFromNewest;
	for (let i = manifest.files.length - 1; i >= 0; i--) {
		const chunk = manifest.files[i];
		if (remaining < chunk.count) {
			return { file: chunk.file, offset: chunk.count - 1 - remaining };
		}
		remaining -= chunk.count;
	}
	return null;
}

export async function getSnapshot(indexFromNewest: number): Promise<Snapshot | null> {
	const at = locate(indexFromNewest);
	if (!at) return null;
	return (await loadChunk(at.file))[at.offset] ?? null;
}
