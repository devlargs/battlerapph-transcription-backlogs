<script lang="ts">
	import { getSnapshots, manifest } from '$lib/data';
	import { COLLECTION_LABELS, COLLECTION_ORDER, type Snapshot } from '$lib/types';

	const PAGE_SIZE = 25;

	let page = $state(0); // 0 = page holding the newest snapshots
	let snapshots = $state<Snapshot[]>([]);
	let error = $state<string | null>(null);
	let loading = $state(true);

	const pageCount = $derived(Math.max(1, Math.ceil(manifest.total / PAGE_SIZE)));

	$effect(() => {
		const wanted = page;
		loading = true;
		error = null;
		getSnapshots(wanted * PAGE_SIZE, PAGE_SIZE)
			.then((result) => {
				if (wanted !== page) return; // a newer request won
				snapshots = result;
				loading = false;
			})
			.catch((err: unknown) => {
				if (wanted !== page) return;
				error = err instanceof Error ? err.message : String(err);
				loading = false;
			});
	});

	/** One row per snapshot; `fetched` is "MM/DD/YYYY hh:mm" and stacks in the date cell. */
	const rows = $derived(
		snapshots.map((snapshot) => {
			const [date, time] = snapshot.fetched.split(' ');
			return {
				fetched: snapshot.fetched,
				date,
				time,
				cells: COLLECTION_ORDER.map((key) => {
					const stat = snapshot.data[key];
					if (!stat) return { key, stat: null, total: 0, pct: 0 };
					const total = stat.c + stat.i;
					return { key, stat, total, pct: total === 0 ? 0 : (stat.c / total) * 100 };
				})
			};
		})
	);

	/** One decimal below 10 %, none above — keeps the meter caption to four characters. */
	const formatPct = (pct: number) => `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;

	const firstOnPage = $derived(page * PAGE_SIZE + 1);
	const lastOnPage = $derived(page * PAGE_SIZE + rows.length);
</script>

<svelte:head>
	<title>BattleRap PH — Transcription Backlogs</title>
</svelte:head>

<main>
	<header>
		<h1>Transcription Backlogs</h1>
		<p class="meta">
			{#if rows.length}
				{manifest.total.toLocaleString()}
				{manifest.total === 1 ? 'snapshot' : 'snapshots'} · Asia/Manila
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

	<div class="table-wrap">
		<table>
			<caption>
				Large figure — items still to transcribe. Below it, completed of total.
			</caption>
			<thead>
				<tr>
					{#each COLLECTION_ORDER as key (key)}
						<th scope="col">{COLLECTION_LABELS[key]}</th>
					{/each}
					<th scope="col">Date</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.fetched)}
					<tr>
						{#each row.cells as cell (cell.key)}
							<td>
								{#if cell.stat}
									<span class="remaining">
										<span class="sr-only">remaining: </span>{cell.stat.i.toLocaleString()}
									</span>
									<span class="ratio">
										<span class="sr-only">completed: </span>{cell.stat.c.toLocaleString()} /
										{cell.total.toLocaleString()}
									</span>
									<span class="meter" aria-hidden="true">
										<span class="meter-fill" style="width: {cell.pct}%"></span>
									</span>
									<span class="pct">{formatPct(cell.pct)}</span>
								{:else}
									<span class="absent">—</span>
								{/if}
							</td>
						{/each}
						<td class="date-cell">
							<span class="date">{row.date}</span>
							<span class="time">{row.time}</span>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan={COLLECTION_ORDER.length + 1} class="empty">
							{#if loading}
								Loading…
							{:else}
								No snapshots yet — run <code>npm run fetch:stats</code> to create the first one.
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<nav class="pager">
		<button onclick={() => (page = Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}>
			← Older
		</button>
		<span>
			{rows.length ? `${firstOnPage}–${lastOnPage}` : 0} of {manifest.total}
		</span>
		<button onclick={() => (page = Math.max(0, page - 1))} disabled={page === 0}>
			Newer →
		</button>
	</nav>
</main>

<style>
	/* Hallmark · component: data-table · genre: modern-minimal · theme: custom dark
	 * states: default · hover · focus-visible · active · disabled · loading · error · empty
	 * tokens: src/tokens.css — no inline colour or font values below
	 * contrast (measured, worst case = row hover): ink 14.7:1 · ink-2 6.6:1
	 *   · ink-3 4.7:1 · focus ring 7.4:1 — all WCAG AA
	 */

	:global(html),
	:global(body) {
		overflow-x: clip;
	}

	:global(body) {
		margin: 0;
		background: var(--color-ground);
		color: var(--color-ink);
		font-family: var(--font-body);
		font-size: var(--text-base);
		-webkit-font-smoothing: antialiased;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	main {
		max-width: 78rem;
		margin: 0 auto;
		padding: var(--space-xl) var(--space-md) var(--space-2xl);
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: var(--text-display);
		letter-spacing: -0.025em;
		overflow-wrap: anywhere;
		min-width: 0;
	}

	/* Machine-readout voice against the grotesk display */
	.meta {
		margin: var(--space-2xs) 0 var(--space-lg);
		color: var(--color-ink-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.error {
		margin: 0 0 var(--space-md);
		background: var(--color-danger-surface);
		border: var(--rule-hairline) solid var(--color-danger);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
	}

	/* The table scrolls inside its own frame — the page never scrolls sideways */
	.table-wrap {
		overflow-x: auto;
		border: var(--rule-hairline) solid var(--color-rule);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	caption {
		caption-side: top;
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		border-bottom: var(--rule-hairline) solid var(--color-rule);
		color: var(--color-ink-3);
		font-size: var(--text-xs);
		line-height: 1.5;
	}

	thead th {
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		border-bottom: var(--rule-hairline) solid var(--color-rule-2);
		color: var(--color-ink-2);
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	tbody td {
		padding: var(--space-md);
		border-bottom: var(--rule-hairline) solid var(--color-rule);
		vertical-align: top;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	/* Elevation by lightness, not shadow — the dark-surface rule */
	tbody tr {
		transition: background-color var(--dur-short) var(--ease-out);
	}

	tbody tr:hover {
		background: var(--color-surface-2);
	}

	.remaining {
		display: block;
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: var(--text-lg);
		line-height: 1.15;
		color: var(--color-ink);
	}

	.ratio {
		display: block;
		margin-top: var(--space-2xs);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-ink-2);
		white-space: nowrap;
	}

	.meter {
		display: block;
		width: 100%;
		min-width: 4.5rem;
		height: var(--meter-height);
		margin-top: var(--space-xs);
		border-radius: var(--radius-pill);
		background: var(--color-rule-2);
		overflow: hidden;
	}

	.meter-fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--color-accent);
	}

	.pct {
		display: block;
		margin-top: var(--space-2xs);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-ink-3);
	}

	.absent {
		color: var(--color-ink-3);
	}

	.date-cell {
		white-space: nowrap;
	}

	.date {
		display: block;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-ink);
	}

	.time {
		display: block;
		margin-top: var(--space-2xs);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--color-ink-2);
	}

	.empty {
		text-align: center;
		color: var(--color-ink-2);
		padding: var(--space-2xl) var(--space-md);
		font-size: var(--text-sm);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.95em;
		color: var(--color-ink);
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-md);
		margin-top: var(--space-md);
		color: var(--color-ink-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
	}

	button {
		background: var(--color-surface);
		color: var(--color-ink);
		border: var(--rule-hairline) solid var(--color-rule-2);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--dur-short) var(--ease-out),
			border-color var(--dur-short) var(--ease-out),
			transform var(--dur-instant) var(--ease-out);
	}

	button:hover:not(:disabled) {
		background: var(--color-surface-2);
		border-color: var(--color-accent);
	}

	/* Ring appears instantly — never transitioned */
	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	button:active:not(:disabled) {
		transform: translateY(1px);
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	@media (max-width: 40rem) {
		main {
			padding: var(--space-lg) var(--space-sm) var(--space-xl);
		}

		.pager {
			justify-content: space-between;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		tbody tr,
		button {
			transition: none;
		}

		button:active:not(:disabled) {
			transform: none;
		}
	}
</style>
