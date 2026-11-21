<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import Thumbnail from '#lib/components/Thumbnail.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { machines, headline, subtitle } = $derived(data);
</script>

<PageMeta title="Pinball" description="Pinball high scores" />

<section class="py-6 sm:py-10">
	<PageHeading {headline} {subtitle} />

	<!-- One machine per row on phones, more on wider screens. Each card lays out by its own width
	     (the @ classes), putting the image beside the text only when there is room. -->
	<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each machines as machine, i (i)}
			<div class="@container card p-5">
				<div
					class="flex flex-col items-center gap-5 text-center @xs:flex-row @xs:items-start @xs:text-left"
				>
					<Thumbnail src={machine.image} alt={machine.name} />
					<div class="flex-1 space-y-3">
						<h2 class="text-lg font-semibold text-card-heading">{machine.name}</h2>
						<dl>
							<dt class="text-xs font-semibold tracking-wider text-card-meta uppercase">
								High Score
							</dt>
							<dd class="text-2xl font-bold text-card-heading lining-nums tabular-nums">
								{machine.highScore}
							</dd>
						</dl>
					</div>
				</div>

				{#if machine.modeScores.length}
					<div class="mt-4 border-t border-card-border pt-4">
						<h3 class="text-base font-semibold tracking-wide text-score-label uppercase">
							Mode High Scores
						</h3>
						<div class="mt-3 grid gap-2 @md:grid-cols-2">
							{#each machine.modeScores as modeScore, j (j)}
								<div
									class="flex items-center justify-between gap-3 rounded-lg bg-badge px-3 py-2 text-sm text-score-caption"
								>
									<span class="text-muted">{modeScore.mode}</span>
									<span class="font-semibold text-score-value lining-nums tabular-nums">
										{modeScore.score}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
