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
	<div
		class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12"
	>
		<!-- Text Introduction Section -->
		<div class="flex-1 space-y-4 text-center md:text-left">
			<div class="space-y-1">
				<p class="text-sm font-semibold tracking-wide text-eyebrow uppercase">Welcome</p>
				<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
					Hi, I'm {name}
				</h1>
			</div>

			<p class="text-lg font-medium text-copy sm:text-xl">
				{tagline}
			</p>

			<div class="space-y-3 text-base leading-relaxed text-muted">
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
					class="h-56 w-56 cursor-pointer rounded-2xl object-cover shadow-md ring-1 ring-photo-ring sm:h-72 sm:w-72"
				/>
			{:else}
				<div
					class="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-photo-border bg-photo-placeholder p-4 text-center text-photo-placeholder-text sm:h-72 sm:w-72"
				>
					<div
						class="flex h-20 w-20 items-center justify-center rounded-full bg-avatar text-2xl font-bold text-avatar-text sm:h-24 sm:w-24 sm:text-3xl"
					>
						{initials}
					</div>
					<span class="mt-3 text-xs font-medium text-eyebrow"> No photo set yet </span>
				</div>
			{/if}
		</div>
	</div>
</section>
