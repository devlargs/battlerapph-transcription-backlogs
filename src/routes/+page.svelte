<script lang="ts">
	import { getSnapshot, manifest } from '$lib/data';
	import { COLLECTION_LABELS, COLLECTION_ORDER, type Snapshot } from '$lib/types';

	let index = $state(0); // 0 = newest snapshot
	let snapshot = $state<Snapshot | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const wanted = index;
		loading = true;
		error = null;
		getSnapshot(wanted)
			.then((result) => {
				if (wanted !== index) return; // a newer request won
				snapshot = result;
				loading = false;
			})
			.catch((err: unknown) => {
				if (wanted !== index) return;
				error = err instanceof Error ? err.message : String(err);
				loading = false;
			});
	});

	const rows = $derived(
		snapshot
			? COLLECTION_ORDER.filter((key) => snapshot!.data[key]).map((key) => ({
					key,
					label: COLLECTION_LABELS[key],
					completed: snapshot!.data[key].c,
					incomplete: snapshot!.data[key].i
				}))
			: []
	);

	const totals = $derived(
		rows.reduce(
			(acc, row) => ({
				completed: acc.completed + row.completed,
				incomplete: acc.incomplete + row.incomplete
			}),
			{ completed: 0, incomplete: 0 }
		)
	);

	const percent = (completed: number, incomplete: number) => {
		const total = completed + incomplete;
		return total === 0 ? '—' : `${((completed / total) * 100).toFixed(1)}%`;
	};
</script>

<svelte:head>
	<title>BattleRap PH — Transcription Backlogs</title>
</svelte:head>

<main>
	<header>
		<h1>Transcription Backlogs</h1>
		<p class="meta">
			{#if snapshot}
				Fetched <strong>{snapshot.fetched}</strong> (Asia/Manila)
			{:else if loading}
				Loading…
			{:else}
				No snapshots yet
			{/if}
		</p>
	</header>

	{#if error}
		<p class="error">Failed to load snapshot: {error}</p>
	{/if}

	<table>
		<thead>
			<tr>
				<th scope="col">Collection</th>
				<th scope="col" class="num">Completed</th>
				<th scope="col" class="num">Incomplete</th>
				<th scope="col" class="num">Total</th>
				<th scope="col" class="num">Done</th>
				<th scope="col">Date</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.key)}
				<tr>
					<th scope="row">{row.label}</th>
					<td class="num">{row.completed.toLocaleString()}</td>
					<td class="num">{row.incomplete.toLocaleString()}</td>
					<td class="num">{(row.completed + row.incomplete).toLocaleString()}</td>
					<td class="num">{percent(row.completed, row.incomplete)}</td>
					<td>{snapshot?.fetched}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="empty">
						{loading ? 'Loading…' : 'Run `npm run fetch:stats` to create the first snapshot.'}
					</td>
				</tr>
			{/each}
		</tbody>
		{#if rows.length}
			<tfoot>
				<tr>
					<th scope="row">All</th>
					<td class="num">{totals.completed.toLocaleString()}</td>
					<td class="num">{totals.incomplete.toLocaleString()}</td>
					<td class="num">{(totals.completed + totals.incomplete).toLocaleString()}</td>
					<td class="num">{percent(totals.completed, totals.incomplete)}</td>
					<td></td>
				</tr>
			</tfoot>
		{/if}
	</table>

	<nav class="pager">
		<button onclick={() => (index = Math.min(manifest.total - 1, index + 1))} disabled={index >= manifest.total - 1}>
			← Older
		</button>
		<span>
			Snapshot {manifest.total === 0 ? 0 : manifest.total - index} of {manifest.total}
		</span>
		<button onclick={() => (index = Math.max(0, index - 1))} disabled={index === 0}>
			Newer →
		</button>
	</nav>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #0b1020;
		color: #e5e7eb;
		font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
	}

	main {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 3rem;
	}

	h1 {
		margin: 0;
		font-size: 1.6rem;
		letter-spacing: -0.01em;
	}

	.meta {
		margin: 0.35rem 0 1.5rem;
		color: #9ca3af;
		font-size: 0.9rem;
	}

	.error {
		background: #7f1d1d;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid #1f2937;
	}

	thead th {
		color: #9ca3af;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	tbody th {
		font-weight: 600;
	}

	.num {
		text-align: right;
	}

	tfoot th,
	tfoot td {
		border-bottom: none;
		color: #f97316;
		font-weight: 600;
	}

	.empty {
		text-align: center;
		color: #9ca3af;
		padding: 2rem 0;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.5rem;
		color: #9ca3af;
		font-size: 0.85rem;
	}

	button {
		background: #111827;
		color: inherit;
		border: 1px solid #1f2937;
		border-radius: 0.4rem;
		padding: 0.4rem 0.8rem;
		font: inherit;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
