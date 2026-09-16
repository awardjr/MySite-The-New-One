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
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Blog</h1>
		<p class="text-base text-muted">Thoughts, updates, and writeups.</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each posts as post (post.slug)}
			{@const isExpanded = !!expanded[post.slug]}
			<article class="rounded-xl border border-card-border bg-card p-5 shadow-sm">
				{#if post.image}
					<img
						src={post.image}
						alt={post.title}
						onclick={() => openLightbox(post.image, post.title)}
						onkeydown={(e) => e.key === 'Enter' && openLightbox(post.image, post.title)}
						tabindex="0"
						class="mb-4 h-48 w-full cursor-pointer rounded-lg object-cover ring-1 ring-card-ring sm:h-64"
					/>
				{/if}

				<h2 class="text-xl font-bold text-card-heading sm:text-2xl">
					{post.title}
				</h2>
				<p class="mt-1 text-xs text-card-meta">{post.date}</p>

				<p class="mt-3 text-sm text-card-copy sm:text-base">
					{isExpanded ? post.content : post.preview}
				</p>

				<div class="mt-4 flex flex-wrap items-center gap-4">
					<button
						type="button"
						onclick={() => toggle(post.slug)}
						class="inline-flex items-center rounded-lg border border-card-border px-3 py-1.5 text-sm text-card-action transition-colors hover:bg-card-hover"
					>
						{isExpanded ? 'Show Less' : 'Read More'}
					</button>
					<a href={`/blog/${post.slug}`} class="text-sm font-medium text-card-link hover:underline">
						View Full Page →
					</a>
				</div>
			</article>
		{/each}
	</div>
</section>
