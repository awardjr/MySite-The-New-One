<script lang="ts">
	import Fa from 'svelte-fa';
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import { faArrowUpRightFromSquare, faGlobe } from '@fortawesome/free-solid-svg-icons';
	import {
		faAndroid,
		faApple,
		faAppStoreIos,
		faLinux,
		faPlaystation,
		faWindows
	} from '@fortawesome/free-brands-svg-icons';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import type { PageProps } from './$types';

	// Nintendo Switch logo from Simple Icons (CC0)
	const faNintendoSwitch = {
		prefix: 'fab',
		iconName: 'nintendo-switch',
		icon: [
			24,
			24,
			[],
			'',
			'M14.176 24h3.674c3.376 0 6.15-2.774 6.15-6.15V6.15C24 2.775 21.226 0 17.85 0H14.1c-.074 0-.15.074-.15.15v23.7c-.001.076.075.15.226.15zm4.574-13.199c1.351 0 2.399 1.125 2.399 2.398 0 1.352-1.125 2.4-2.399 2.4-1.35 0-2.4-1.049-2.4-2.4-.075-1.349 1.05-2.398 2.4-2.398zM11.4 0H6.15C2.775 0 0 2.775 0 6.15v11.7C0 21.226 2.775 24 6.15 24h5.25c.074 0 .15-.074.15-.149V.15c.001-.076-.075-.15-.15-.15zM9.676 22.051H6.15c-2.326 0-4.201-1.875-4.201-4.201V6.15c0-2.326 1.875-4.201 4.201-4.201H9.6l.076 20.102zM3.75 7.199c0 1.275.975 2.25 2.25 2.25s2.25-.975 2.25-2.25c0-1.273-.975-2.25-2.25-2.25s-2.25.977-2.25 2.25z'
		]
	} as unknown as IconDefinition;

	const platformIcons: Record<string, { label: string; icon: typeof faGlobe }> = {
		web: { label: 'Web', icon: faGlobe },
		windows: { label: 'Windows', icon: faWindows },
		macos: { label: 'macOS', icon: faApple },
		ios: { label: 'iOS', icon: faAppStoreIos },
		linux: { label: 'Linux', icon: faLinux },
		android: { label: 'Android', icon: faAndroid },
		playstation: { label: 'Playstation', icon: faPlaystation },
		switch: { label: 'Nintendo Switch', icon: faNintendoSwitch }
	};

	let { data }: PageProps = $props();
	let { works, siteName, headline, subtitle } = $derived(data);
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
		{#each works as work (work.id)}
			<div
				id="work-{work.id}"
				class="relative flex scroll-mt-20 flex-col gap-5 rounded-xl border border-card-border bg-card p-5 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover target:ring-2 target:ring-photo-ring sm:flex-row sm:items-start"
			>
				{#if work.link}
					<a
						href={work.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`${work.title} (opens in a new tab)`}
						class="absolute inset-0 z-0 rounded-xl"
					></a>
					<span
						title="Opens an external site"
						class="pointer-events-none absolute top-3 right-3 z-10 text-muted"
					>
						<Fa icon={faArrowUpRightFromSquare} class="h-4 w-4" />
					</span>
				{/if}

				<!-- Image Section -->
				<div class="relative z-10 flex shrink-0 justify-center sm:justify-start">
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
				<div class="pointer-events-none relative z-10 flex-1 space-y-3">
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
									aria-label={platformIcons[platformKey].label}
									class="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg bg-badge text-badge-text"
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
