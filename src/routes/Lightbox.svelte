<script lang="ts">
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { getLightbox, closeLightbox } from '$lib/lightbox.svelte';

	const lightbox = getLightbox();
</script>

{#if lightbox.src}
	<div
		class="fixed inset-0 z-100 flex items-center justify-center bg-overlay p-4"
		role="button"
		tabindex="0"
		aria-label="Close expanded image"
		onclick={closeLightbox}
		onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && closeLightbox()}
	>
		<button
			type="button"
			onclick={closeLightbox}
			aria-label="Close expanded image"
			class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-overlay-button text-overlay-text transition-colors hover:bg-overlay-button-hover"
		>
			<Fa icon={faXmark} class="h-5 w-5" />
		</button>
		<img
			src={lightbox.src}
			alt={lightbox.alt}
			class="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		/>
	</div>
{/if}
