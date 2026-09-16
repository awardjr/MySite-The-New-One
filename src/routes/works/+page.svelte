<script lang="ts">
	import Fa from 'svelte-fa';
	import { faGlobe, faGamepad } from '@fortawesome/free-solid-svg-icons';
	import {
		faWindows,
		faApple,
		faLinux,
		faPlaystation,
		faAppStoreIos,
		faAndroid,
	} from '@fortawesome/free-brands-svg-icons';
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';


	const platformIcons: Record<string, { label: string; icon: typeof faGlobe }> = {
		web: { label: 'Web', icon: faGlobe },
		windows: { label: 'Windows', icon: faWindows },
		macos: { label: 'macOS', icon: faApple },
		ios: {label: 'iOS', icon: faAppStoreIos},
		linux: { label: 'Linux', icon: faLinux },
		android: { label: 'Android', icon: faAndroid },
		playstation: {label: 'Playstation', icon: faPlaystation},
		switch: { label: 'Nintendo Switch', icon: faGamepad }
	};

	let { data }: PageProps = $props();
	let { works } = $derived(data);
</script>

<svelte:head>
	<title>Works - Arthur Ward Jr</title>
	<meta name="description" content="Works - Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Works</h1>
		<p class="text-lg text-muted">Some of things I've worked on</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each works as work, i (i)}
			<div
				class="flex flex-col gap-5 rounded-xl border border-card-border bg-card p-5 shadow-sm transition-transform duration-200 hover:scale-[1.02] sm:flex-row sm:items-start"
			>
				<!-- Image Section -->
				<div class="flex shrink-0 justify-center sm:justify-start">
					{#if work.image}
						<button
							type="button"
							onclick={() => openLightbox(work.image, work.title)}
							aria-label={`View larger image of ${work.title}`}
						>
							<img
								src={work.image}
								alt={work.title}
								class="h-40 w-40 cursor-pointer rounded-lg object-cover ring-1 ring-card-ring sm:h-32 sm:w-32"
							/>
						</button>
					{:else}
						<div
							class="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-image-placeholder-border bg-image-placeholder text-center text-xs text-image-placeholder-text sm:h-32 sm:w-32"
						>
							No Image
						</div>
					{/if}
				</div>

				<!-- Text + Platforms Section -->
				<div class="flex-1 space-y-3">
					<h2 class="text-xl font-semibold text-card-heading">
						{work.title}
					</h2>
					<p class="text-lg leading-relaxed text-card-copy">
						{work.description}
					</p>
					<div class="flex flex-wrap gap-2 pt-1">
						{#each work.platforms as platformKey (platformKey)}
							{#if platformIcons[platformKey]}
								<span
									title={platformIcons[platformKey].label}
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-badge text-badge-text"
								>
									<Fa icon={platformIcons[platformKey].icon} class="h-4 w-4" />
								</span>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
