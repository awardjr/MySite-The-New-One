<script lang="ts">
	import Fa from 'svelte-fa';
	import { faGlobe, faGamepad } from '@fortawesome/free-solid-svg-icons';
	import { faWindows, faApple, faLinux, faPlaystation, faXbox } from '@fortawesome/free-brands-svg-icons';
	import { openLightbox } from '$lib/lightbox.svelte';

	// Map of supported platform keys to their display label and icon.
	// Add a new entry here to support another platform, then reference its key in a work's `platforms` array.
	const platformIcons: Record<string, { label: string; icon: typeof faGlobe }> = {
		web: { label: 'Web', icon: faGlobe },
		windows: { label: 'Windows', icon: faWindows },
		macos: { label: 'macOS', icon: faApple },
		linux: { label: 'Linux', icon: faLinux },
		playstation: { label: 'PlayStation', icon: faPlaystation },
		xbox: { label: 'Xbox', icon: faXbox },
		switch: { label: 'Nintendo Switch', icon: faGamepad }
	};

	// Add, remove, or edit works below. `image` can be a path from static/ (e.g. '/works/my-project.png').
	// `platforms` is a list of keys from `platformIcons` above.
	const works: {
		title: string;
		description: string;
		image: string;
		platforms: string[];
	}[] = [
		{
			title: 'Project Title',
			description: 'A brief description of what this project is, what you built, and the technologies used.',
			image: '',
			platforms: ['web', 'windows', 'macos']
		}
		// {
		// 	title: 'Another Project',
		// 	description: 'Description of another project.',
		// 	image: '/works/another-project.png',
		// 	platforms: ['switch', 'playstation', 'xbox']
		// }
	];
</script>

<svelte:head>
	<title>Works - Arthur Ward Jr</title>
	<meta name="description" content="Works - Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Works
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">A selection of things I've built.</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each works as work (work.title)}
			<div
				class="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start dark:border-gray-800 dark:bg-gray-950 hotdog:border-black hotdog:bg-yellow-300"
			>
				<!-- Image Section -->
				<div class="flex shrink-0 justify-center sm:justify-start">
					{#if work.image}
						<img
							src={work.image}
							alt={work.title}
							onclick={() => openLightbox(work.image, work.title)}
							onkeydown={(e) => e.key === 'Enter' && openLightbox(work.image, work.title)}
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

				<!-- Text + Platforms Section -->
				<div class="flex-1 space-y-3">
					<h2 class="text-lg font-semibold text-gray-950 dark:text-gray-50 hotdog:text-black">
						{work.title}
					</h2>
					<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400 hotdog:text-red-900">
						{work.description}
					</p>
					<div class="flex flex-wrap gap-2 pt-1">
						{#each work.platforms as platformKey (platformKey)}
							{#if platformIcons[platformKey]}
								<span
									title={platformIcons[platformKey].label}
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 hotdog:bg-red-600 hotdog:text-yellow-200"
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
