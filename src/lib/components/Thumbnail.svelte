<script lang="ts">
	import { faImage } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import { srcset } from '#lib/responsiveImage.js';

	let {
		src,
		alt,
		sizes = '(min-width: 640px) 128px, 160px',
		class: className
	}: { src: string; alt: string; sizes?: string; class?: string } = $props();
</script>

{#if src}
	<button
		type="button"
		class={className}
		onclick={() => openLightbox(src, alt)}
		aria-label={`View larger image of ${alt}`}
	>
		<img
			{src}
			srcset={srcset(src)}
			{sizes}
			{alt}
			loading="lazy"
			decoding="async"
			class="h-40 w-40 cursor-pointer rounded-xl object-cover ring-1 ring-card-ring sm:h-32 sm:w-32"
		/>
	</button>
{:else}
	<div
		aria-hidden="true"
		class="flex h-40 w-40 items-center justify-center rounded-xl border border-image-placeholder-border bg-image-placeholder text-image-placeholder-text sm:h-32 sm:w-32"
	>
		<Fa icon={faImage} class="h-6 w-6" />
	</div>
{/if}
