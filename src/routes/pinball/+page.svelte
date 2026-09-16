<script lang="ts">
	import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { machines } = $derived(data);

	let expanded: Record<number, boolean> = $state({});

	function toggle(index: number) {
		expanded[index] = !expanded[index];
	}
</script>

<svelte:head>
	<title>Pinball - Arthur Ward Jr</title>
	<meta name="description" content="Pinball high scores" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Pinball</h1>
		<p class="text-base text-muted">High scores from the pinball machines I've played.</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each machines as machine, i (i)}
			{@const isExpanded = !!expanded[i]}
			{@const hasMore = !!machine.modeScores && machine.modeScores.length > 0}
			<div class="rounded-xl border border-card-border bg-card p-5 shadow-sm">
				<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
					<!-- Image Section -->
					<div class="flex shrink-0 justify-center sm:justify-start">
						{#if machine.image}
							<img
								src={machine.image}
								alt={machine.name}
								onclick={() => openLightbox(machine.image, machine.name)}
								onkeydown={(e) => e.key === 'Enter' && openLightbox(machine.image, machine.name)}
								tabindex="0"
								class="h-40 w-40 cursor-pointer rounded-lg object-cover ring-1 ring-card-ring sm:h-32 sm:w-32"
							/>
						{:else}
							<div
								class="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-image-placeholder-border bg-image-placeholder text-center text-xs text-image-placeholder-text sm:h-32 sm:w-32"
							>
								No Image
							</div>
						{/if}
					</div>

					<!-- Text Section -->
					<div class="flex-1 space-y-2">
						<h2 class="text-lg font-semibold text-card-heading">
							{machine.name}
						</h2>
						<p class="text-sm text-card-copy">
							High Score: <span class="font-semibold text-card-heading">{machine.highScore}</span>
						</p>
					</div>

					<!-- Expand Toggle -->
					{#if hasMore}
						<div class="flex shrink-0 justify-end sm:justify-start">
							<button
								type="button"
								onclick={() => toggle(i)}
								aria-expanded={isExpanded}
								class="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-card-action transition-colors hover:bg-card-hover"
							>
								{isExpanded ? 'Less' : 'More'}
								<Fa icon={isExpanded ? faChevronUp : faChevronDown} class="h-3 w-3" />
							</button>
						</div>
					{/if}
				</div>

				{#if hasMore && isExpanded}
					<div class="mt-4 border-t border-card-border pt-4">
						<h3 class="text-sm font-semibold tracking-wide text-score-label uppercase">
							High Scores by Mode
						</h3>
						<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each machine.modeScores ?? [] as modeScore, j (j)}
								<div
									class="flex items-center justify-between rounded-lg bg-badge px-3 py-2 text-sm text-score-caption"
								>
									<span class="text-muted">{modeScore.mode}</span>
									<span class="font-semibold text-score-value">{modeScore.score}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
