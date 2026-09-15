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
	<a
		href="/blog"
		class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 hotdog:text-yellow-200"
	>
		← Back to Blog
	</a>

	<article class="mt-4 max-w-3xl">
		{#if post.image}
			<img
				src={post.image}
				alt={post.title}
				onclick={() => openLightbox(post.image, post.title)}
				onkeydown={(e) => e.key === 'Enter' && openLightbox(post.image, post.title)}
				tabindex="0"
				class="mb-6 h-56 w-full cursor-pointer rounded-lg object-cover ring-1 ring-gray-200 sm:h-80 dark:ring-gray-800 hotdog:ring-yellow-400"
			/>
		{/if}

		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			{post.title}
		</h1>
		<p class="mt-1 text-xs text-gray-500 dark:text-gray-400 hotdog:text-yellow-200">{post.date}</p>

		<p class="mt-6 text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 hotdog:text-yellow-100">
			{post.content}
		</p>
	</article>
</section>
