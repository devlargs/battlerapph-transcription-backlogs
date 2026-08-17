#!/usr/bin/env node
/**
 * Fetches https://api.battlerapph.com/api/stats/all and appends a snapshot to
 * the newest chunk in data/json. Chunks hold at most LIMIT snapshots; once full
 * the next numbered file (0001.json -> 0002.json -> ...) is created.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://api.battlerapph.com/api/stats/all';
const LIMIT = 100;
const TIME_ZONE = 'Asia/Manila';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data', 'json');
const MANIFEST = path.join(DATA_DIR, 'manifest.json');

/** MM/DD/YYYY hh:mm */
function formatTimestamp(date) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).formatToParts(date);
	const get = (type) => parts.find((p) => p.type === type).value;
	return `${get('month')}/${get('day')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

const chunkName = (n) => `${String(n).padStart(4, '0')}.json`;

async function readJson(file, fallback) {
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch (err) {
		if (err.code === 'ENOENT') return fallback;
		throw err;
	}
}

// Minified — these files grow to 100 snapshots each and are committed on every run.
const writeJson = (file, value) => writeFile(file, JSON.stringify(value));

async function fetchStats() {
	const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`${API_URL} responded ${res.status} ${res.statusText}`);
	return res.json();
}

async function main() {
	await mkdir(DATA_DIR, { recursive: true });

	const snapshot = { fetched: formatTimestamp(new Date()), data: await fetchStats() };

	// Rebuild the file list from disk so a hand-edited/partially committed
	// manifest can never point at a chunk that does not exist.
	const existing = (await readdir(DATA_DIR))
		.filter((name) => /^\d{4}\.json$/.test(name))
		.sort();

	let target = existing.at(-1);
	let entries = target ? await readJson(path.join(DATA_DIR, target), []) : [];

	if (!target || entries.length >= LIMIT) {
		target = chunkName(existing.length + 1);
		entries = [];
	}

	entries.push(snapshot);
	await writeJson(path.join(DATA_DIR, target), entries);

	const files = existing.includes(target) ? existing : [...existing, target];
	const manifest = { limit: LIMIT, total: 0, files: [] };
	for (const file of files) {
		const count =
			file === target ? entries.length : (await readJson(path.join(DATA_DIR, file), [])).length;
		manifest.files.push({ file, count });
		manifest.total += count;
	}
	await writeJson(MANIFEST, manifest);

	console.log(`Appended ${snapshot.fetched} to data/json/${target} (${manifest.total} total).`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
