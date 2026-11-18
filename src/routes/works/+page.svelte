<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import { getPlatform } from '#lib/platforms.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { items, siteName, headline, subtitle } = $derived(data);
</script>

<svelte:head>
	<title>{siteName ? `Works - ${siteName}` : 'Works'}</title>
	<meta content={siteName ? `Works - ${siteName}` : 'Works'} name="description" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
		<p class="text-lg text-muted">{subtitle}</p>
	</div>

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
					></a>
					<span
						title="Opens an external site"
						class="pointer-events-none absolute top-4 right-4 z-10 text-card-action transition-colors group-hover:text-card-heading"
					>
						<Fa icon={faArrowUpRightFromSquare} class="h-4 w-4" />
					</span>
				{/if}

				<!-- Image Section -->
				<div
					class="relative z-10 flex shrink-0 justify-center max-sm:w-full max-sm:pr-5 sm:justify-start"
				>
					{#if work.image}
						<button
							class="max-sm:w-full"
							type="button"
							onclick={() => openLightbox(work.image, work.title)}
							aria-label={`View larger image of ${work.title}`}
						>
							<img
								src={work.image}
								loading="lazy"
								decoding="async"
								alt={work.title}
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

				<!-- Text + Platforms Section -->
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
