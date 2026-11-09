<script lang="ts">
	import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { machines, siteName, headline, subtitle } = $derived(data);

	let expanded: Record<number, boolean> = $state({});

	function toggle(index: number) {
		expanded[index] = !expanded[index];
	}
</script>

<svelte:head>
	<title>{siteName ? `Pinball - ${siteName}` : 'Pinball'}</title>
	<meta name="description" content="Pinball high scores" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
		<p class="text-lg text-muted">
			{subtitle}
		</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each machines as machine, i (i)}
			{@const isExpanded = !!expanded[i]}
			{@const hasMore = !!machine.modeScores && machine.modeScores.length > 0}
			<div class="card p-5">
				<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
					<!-- Image Section -->
					<div class="flex shrink-0 justify-center sm:justify-start">
						{#if machine.image}
							<button
								type="button"
								onclick={() => openLightbox(machine.image, machine.name)}
								aria-label={`View larger image of ${machine.name}`}
							>
								<img
									src={machine.image}
									alt={machine.name}
									class="h-40 w-40 cursor-pointer rounded-xl object-cover ring-1 ring-card-ring sm:h-32 sm:w-32"
								/>
							</button>
						{:else}
							<div
								class="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-image-placeholder-border bg-image-placeholder text-center text-xs text-image-placeholder-text sm:h-32 sm:w-32"
							>
								No Image
							</div>
						{/if}
					</div>

					<!-- Text Section -->
					<div class="flex-1 space-y-3">
						<h2 class="text-lg font-semibold text-card-heading">
							{machine.name}
						</h2>
						<dl>
							<dt class="text-xs font-semibold tracking-wider text-card-meta uppercase">
								High Score
							</dt>
							<dd class="text-2xl font-bold text-card-heading lining-nums tabular-nums">
								{machine.highScore}
							</dd>
						</dl>
					</div>

					<!-- Expand Toggle -->
					{#if hasMore}
						<div class="flex shrink-0 justify-end sm:justify-start">
							<button
								type="button"
								onclick={() => toggle(i)}
								aria-expanded={isExpanded}
								class="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-card-action transition-colors hover:border-card-border-hover hover:bg-card-border"
							>
								{isExpanded ? 'Hide Mode High Scores' : 'Show Mode High Scores'}
								<span
									class={[
										'transition-transform duration-200 motion-reduce:transition-none',
										isExpanded && 'rotate-180'
									]}
								>
									<Fa icon={faChevronDown} class="h-3 w-3" />
								</span>
							</button>
						</div>
					{/if}
				</div>

				{#if hasMore && isExpanded}
					<div class="mt-4 border-t border-card-border pt-4">
						<h3 class="text-base font-semibold tracking-wide text-score-label uppercase">
							Mode High Scores
						</h3>
						<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each machine.modeScores ?? [] as modeScore, j (j)}
								<div
									class="flex items-center justify-between rounded-lg bg-badge px-3 py-2 text-sm text-score-caption"
								>
									<span class="text-muted">{modeScore.mode}</span>
									<span class="font-semibold text-score-value lining-nums tabular-nums"
										>{modeScore.score}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
