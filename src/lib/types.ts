export type StatKey = 'em' | 'lg' | 'lc' | 'ev' | 'bt' | 'vr';

/** `c` = completed, `i` = incomplete — as returned by the stats API. */
export type Stat = { c: number; i: number };

export type Snapshot = {
	/** MM/DD/YYYY hh:mm in Asia/Manila */
	fetched: string;
	data: Record<StatKey, Stat>;
};

export type ChunkInfo = { file: string; count: number };

export type Manifest = {
	files: ChunkInfo[];
	total: number;
	/** Max snapshots stored per chunk file. */
	limit: number;
};

export const COLLECTION_LABELS: Record<StatKey, string> = {
	em: 'Emcees',
	lg: 'Leagues',
	lc: 'Locations',
	ev: 'Events',
	bt: 'Battles',
	vr: 'Verses'
};

export const COLLECTION_ORDER: StatKey[] = ['em', 'lg', 'lc', 'ev', 'bt', 'vr'];
