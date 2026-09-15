<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { posts } = $derived(data);

	let expanded: Record<string, boolean> = $state({});

	function toggle(slug: string) {
		expanded[slug] = !expanded[slug];
	}
</script>

<svelte:head>
	<title>Blog - Arthur Ward Jr</title>
	<meta name="description" content="Blog posts by Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Blog
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">Thoughts, updates, and writeups.</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each posts as post (post.slug)}
			{@const isExpanded = !!expanded[post.slug]}
			<article
				class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 hotdog:border-black hotdog:bg-yellow-300"
			>
				{#if post.image}
					<img
						src={post.image}
						alt={post.title}
						onclick={() => openLightbox(post.image, post.title)}
						onkeydown={(e) => e.key === 'Enter' && openLightbox(post.image, post.title)}
						tabindex="0"
						class="mb-4 h-48 w-full cursor-pointer rounded-lg object-cover ring-1 ring-gray-200 sm:h-64 dark:ring-gray-800 hotdog:ring-black"
					/>
				{/if}

				<h2 class="text-xl font-bold text-gray-950 sm:text-2xl dark:text-gray-50 hotdog:text-black">
					{post.title}
				</h2>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400 hotdog:text-red-900">{post.date}</p>

				<p class="mt-3 text-sm text-gray-600 sm:text-base dark:text-gray-400 hotdog:text-red-900">
					{isExpanded ? post.content : post.preview}
				</p>

				<div class="mt-4 flex flex-wrap items-center gap-4">
					<button
						type="button"
						onclick={() => toggle(post.slug)}
						class="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 hotdog:border-black hotdog:text-black hotdog:hover:bg-yellow-200"
					>
						{isExpanded ? 'Show Less' : 'Read More'}
					</button>
					<a
						href={`/blog/${post.slug}`}
						class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 hotdog:text-black"
					>
						View Full Page →
					</a>
				</div>
			</article>
		{/each}
	</div>
</section>
