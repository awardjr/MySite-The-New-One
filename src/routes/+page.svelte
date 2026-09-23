<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { name, tagline, photoSrc, introParagraphs } = $derived(data.home);
</script>

<svelte:head>
	<title>Home - {name}</title>
	<meta content="Personal Website for {name}" name="description" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div
		class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12"
	>
		<!-- Text Introduction Section -->
		<div class="flex-1 space-y-4 text-center md:text-left">
			<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
				Hi, I'm {name}
			</h1>

			<p class="text-lg font-medium text-copy sm:text-2xl">
				{tagline}
			</p>

			<div class="space-y-3 text-lg leading-relaxed text-muted">
				{#each introParagraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>

		<!-- Photo Section -->
		<div class="flex shrink-0 justify-center">
			<button
				aria-label={`View larger photo of ${name}`}
				onclick={() => openLightbox(photoSrc, name)}
				type="button"
			>
				<img
					alt={name}
					class="h-56 w-56 cursor-pointer rounded-2xl object-cover shadow-md ring-1 ring-photo-ring sm:h-72 sm:w-72"
					src={photoSrc}
				/>
			</button>
		</div>
	</div>
</section>
