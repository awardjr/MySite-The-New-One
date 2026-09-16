<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { post } = $derived(data);
</script>

<svelte:head>
	<title>{post.title} - Arthur Ward Jr</title>
	<meta name="description" content={post.preview} />
</svelte:head>

<section class="py-6 sm:py-10">
	<a href="/blog" class="text-sm font-medium text-link hover:underline"> ← Back to Blog </a>

	<article class="mt-4 max-w-3xl">
		{#if post.image}
			<button
				type="button"
				onclick={() => openLightbox(post.image, post.title)}
				aria-label={`View larger image for ${post.title}`}
				class="block w-full"
			>
				<img
					src={post.image}
					alt={post.title}
					class="mb-6 h-56 w-full cursor-pointer rounded-lg object-cover ring-1 ring-photo-ring sm:h-80"
				/>
			</button>
		{/if}

		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
			{post.title}
		</h1>
		<p class="mt-1 text-s text-eyebrow">{post.date}</p>

		<p class="mt-6 text-lg leading-relaxed whitespace-pre-line text-copy">
			{post.content}
		</p>
	</article>
</section>
