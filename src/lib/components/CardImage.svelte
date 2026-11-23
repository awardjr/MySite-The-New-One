<script lang="ts">
	import { srcset } from '#lib/responsiveImage.js';

	let {
		src,
		alt,
		sizes = '(min-width: 1024px) 976px, 100vw',
		class: className
	}: { src: string; alt: string; sizes?: string; class?: string } = $props();
</script>

<div class={['h-48 overflow-hidden border-b border-card-border', className]}>
	<img
		{src}
		srcset={srcset(src)}
		{sizes}
		{alt}
		loading="lazy"
		decoding="async"
		class="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
	/>
</div>
