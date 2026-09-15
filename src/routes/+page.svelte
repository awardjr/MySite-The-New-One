<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { name, tagline, photoSrc, introParagraphs } = $derived(data.home);
	let initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.map((part) => part[0]?.toUpperCase())
			.slice(0, 2)
			.join('')
	);
</script>

<svelte:head>
	<title>Home - {name}</title>
	<meta name="description" content="{name} - Personal Homepage" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
		<!-- Text Introduction Section -->
		<div class="flex-1 space-y-4 text-center md:text-left">
			<div class="space-y-1">
				<p class="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 hotdog:text-yellow-200">
					Welcome
				</p>
				<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl dark:text-gray-50 hotdog:text-yellow-300">
					Hi, I'm {name}
				</h1>
			</div>

			<p class="text-lg font-medium text-gray-700 sm:text-xl dark:text-gray-300 hotdog:text-yellow-100">
				{tagline}
			</p>

			<div class="space-y-3 text-base leading-relaxed text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
				{#each introParagraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>

		<!-- Photo Section -->
		<div class="flex shrink-0 justify-center">
			{#if photoSrc}
				<img
					src={photoSrc}
					alt={name}
					onclick={() => openLightbox(photoSrc, name)}
					onkeydown={(e) => e.key === 'Enter' && openLightbox(photoSrc, name)}
					tabindex="0"
					class="h-56 w-56 cursor-pointer rounded-2xl object-cover shadow-md ring-1 ring-gray-200 sm:h-72 sm:w-72 dark:ring-gray-800 hotdog:ring-yellow-400"
				/>
			{:else}
				<div
					class="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center text-gray-400 sm:h-72 sm:w-72 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 hotdog:border-yellow-400 hotdog:bg-red-700 hotdog:text-yellow-200"
				>
					<div
						class="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600 sm:h-24 sm:w-24 sm:text-3xl dark:bg-gray-800 dark:text-gray-300 hotdog:bg-yellow-300 hotdog:text-red-700"
					>
						{initials}
					</div>
					<span class="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 hotdog:text-yellow-200">
						Set a photo in <a href="/admin/home" class="underline">the admin panel</a> to display it here
					</span>
				</div>
			{/if}
		</div>
	</div>
</section>
