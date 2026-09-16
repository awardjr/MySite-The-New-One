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
	<title>Posts - Arthur Ward Jr</title>
	<meta name="description" content="Posts by Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Blog</h1>
		<p class="text-lg text-muted">Musings perhaps</p>
	</div>

	<div class="mt-8 space-y-6">
		{#each posts as post (post.slug)}
			{@const isExpanded = !!expanded[post.slug]}
			<article
				class="rounded-xl border border-card-border bg-card p-5 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
			>
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
							class="mb-4 h-48 w-full cursor-pointer rounded-lg object-cover ring-1 ring-card-ring sm:h-64"
						/>
					</button>
				{/if}

				<h2 class="text-xl font-bold text-card-heading sm:text-2xl">
					{post.title}
				</h2>
				<p class="mt-1 text-s text-card-meta">{post.date}</p>

				<p class="mt-3 text-sm text-card-copy sm:text-lg">
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
						View Full →
					</a>
				</div>
			</article>
		{/each}
	</div>
</section>
