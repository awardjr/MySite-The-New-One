<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import Fa from 'svelte-fa';
	import ExternalLinkIcon from '#lib/components/ExternalLinkIcon.svelte';
	import Thumbnail from '#lib/components/Thumbnail.svelte';
	import { getPlatform } from '#lib/platforms.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { items, headline, subtitle } = $derived(data);
</script>

<PageMeta title="Works" />

<section class="py-6 sm:py-10">
	<PageHeading {headline} {subtitle} />

	<div class="mt-8 space-y-6">
		{#each items as work (work.id)}
			<div
				id="work-{work.id}"
				class={[
					'group card relative flex scroll-mt-20 flex-col gap-5 p-5 target:ring-2 target:ring-photo-ring sm:flex-row sm:items-start',
					work.link && 'card-interactive'
				]}
			>
				{#if work.link}
					<a
						href={work.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`${work.title} (opens in a new tab)`}
						class="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
					>
						<ExternalLinkIcon href={work.link} class="top-4 right-4" />
					</a>
				{/if}

				<div
					class="relative z-10 flex shrink-0 justify-center max-sm:w-full max-sm:pr-5 sm:justify-start"
				>
					<Thumbnail src={work.image} alt={work.title} class="max-sm:w-full" />
				</div>

				<div class="pointer-events-none relative z-10 flex-1 space-y-3">
					<h2 class={['text-xl font-semibold text-card-heading', work.link && 'sm:pr-8']}>
						{work.title}
					</h2>
					<p class="text-lg leading-relaxed text-card-copy">
						{work.description}
					</p>
					<div class="flex flex-wrap gap-2 pt-1">
						{#each work.platforms as platformKey (platformKey)}
							{@const platform = getPlatform(platformKey)}
							{#if platform}
								<span
									title={platform.label}
									aria-label={platform.label}
									class="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg bg-badge text-badge-text"
								>
									<Fa icon={platform.icon} class="h-4 w-4" />
								</span>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
