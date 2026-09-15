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
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Pinball
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
			High scores from the pinball machines I've played.
		</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each machines as machine, i (i)}
			{@const isExpanded = !!expanded[i]}
			{@const hasMore = !!machine.modeScores && machine.modeScores.length > 0}
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 hotdog:border-black hotdog:bg-yellow-300"
			>
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
								class="h-40 w-40 cursor-pointer rounded-lg object-cover ring-1 ring-gray-200 sm:h-32 sm:w-32 dark:ring-gray-800 hotdog:ring-black"
							/>
						{:else}
							<div
								class="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center text-xs text-gray-400 sm:h-32 sm:w-32 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 hotdog:border-red-700 hotdog:bg-red-600 hotdog:text-yellow-100"
							>
								No Image
							</div>
						{/if}
					</div>

					<!-- Text Section -->
					<div class="flex-1 space-y-2">
						<h2 class="text-lg font-semibold text-gray-950 dark:text-gray-50 hotdog:text-black">
							{machine.name}
						</h2>
						<p class="text-sm text-gray-600 dark:text-gray-400 hotdog:text-red-900">
							High Score: <span class="font-semibold text-gray-950 dark:text-gray-50 hotdog:text-black">{machine.highScore}</span>
						</p>
					</div>

					<!-- Expand Toggle -->
					{#if hasMore}
						<div class="flex shrink-0 justify-end sm:justify-start">
							<button
								type="button"
								onclick={() => toggle(i)}
								aria-expanded={isExpanded}
								class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 hotdog:border-black hotdog:text-black hotdog:hover:bg-yellow-200"
							>
								{isExpanded ? 'Less' : 'More'}
								<Fa icon={isExpanded ? faChevronUp : faChevronDown} class="h-3 w-3" />
							</button>
						</div>
					{/if}
				</div>

				{#if hasMore && isExpanded}
					<div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800 hotdog:border-black">
						<h3 class="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 hotdog:text-red-800">
							High Scores by Mode
						</h3>
						<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each machine.modeScores ?? [] as modeScore, j (j)}
								<div
									class="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-900 hotdog:bg-red-600 hotdog:text-yellow-200"
								>
									<span class="text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">{modeScore.mode}</span>
									<span class="font-semibold text-gray-950 dark:text-gray-50 hotdog:text-yellow-200">{modeScore.score}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
