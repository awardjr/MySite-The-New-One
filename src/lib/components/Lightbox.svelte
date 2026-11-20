<script lang="ts">
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { getLightbox, closeLightbox } from '#lib/lightbox.svelte.js';

	const lightbox = getLightbox();
	let dialog: HTMLDialogElement | undefined = $state();

	// A modal <dialog> keeps keyboard focus inside, closes on Escape, and returns focus afterwards.
	$effect(() => {
		if (!dialog) return;
		if (lightbox.src && !dialog.open) dialog.showModal();
		else if (!lightbox.src && dialog.open) dialog.close();
	});

	function closeUnlessImage(event: MouseEvent) {
		if (!(event.target instanceof HTMLImageElement)) closeLightbox();
	}
</script>

<!-- Escape and the close button are the keyboard equivalents of clicking outside the image. -->
<dialog
	bind:this={dialog}
	aria-label="Expanded image"
	onclose={closeLightbox}
	onclick={closeUnlessImage}
	class="fixed inset-0 z-100 m-0 h-dvh max-h-none w-dvw max-w-none items-center justify-center bg-overlay p-4 open:flex"
>
	<button
		type="button"
		aria-label="Close expanded image"
		class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-overlay-button text-overlay-text transition-colors hover:bg-overlay-button-hover"
	>
		<Fa icon={faXmark} class="h-5 w-5" />
	</button>
	{#if lightbox.src}
		<img
			src={lightbox.src}
			alt={lightbox.alt}
			class="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
		/>
	{/if}
</dialog>
