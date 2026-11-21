<script lang="ts">
	/** The banner image of a linked card, which zooms in slightly while the card is hovered. */
	let { src, alt, class: className }: { src: string; alt: string; class?: string } = $props();
</script>

<div class={['h-48 overflow-hidden border-b border-card-border', className]}>
	<img
		{src}
		{alt}
		loading="lazy"
		decoding="async"
		class="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
	/>
</div>
