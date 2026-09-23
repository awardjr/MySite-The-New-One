<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
	let { posts, siteName } = $derived(data);

	let expanded: Record<string, boolean> = $state({});

	function toggle(slug: string) {
		expanded[slug] = !expanded[slug];
	}
</script>

<svelte:head>
	<title>{siteName ? `Posts - ${siteName}` : 'Posts'}</title>
	<meta name="description" content={siteName ? `Posts by ${siteName}` : 'Posts'} />
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
				<p class="mt-1 text-card-meta">{post.date}</p>

				{#if isExpanded}
					<div class="post-content mt-3 text-sm text-card-copy sm:text-lg">
						<!-- Sanitized on the admin page -->
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html post.content}
					</div>
				{:else}
					<p class="mt-3 text-sm text-card-copy sm:text-lg">
						{post.preview}
					</p>
				{/if}

				<div class="mt-4 flex flex-wrap items-center gap-4">
					<button
						type="button"
						onclick={() => toggle(post.slug)}
						class="inline-flex items-center rounded-lg border border-card-border px-3 py-1.5 text-sm text-card-action transition-colors hover:bg-card-hover"
					>
						{isExpanded ? 'Show Less' : 'Read More'}
					</button>
					<a
						href={resolve('/blog/[slug]', { slug: post.slug })}
						class="text-sm font-medium text-card-link hover:underline"
					>
						View Full →
					</a>
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.post-content :global(p) {
		margin: 0.5rem 0;
	}

	.post-content :global(h2) {
		margin: 1rem 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-card-heading);
	}

	.post-content :global(h3) {
		margin: 0.75rem 0 0.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-card-heading);
	}

	.post-content :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.post-content :global(ol) {
		list-style: decimal;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.post-content :global(blockquote) {
		border-left: 3px solid var(--color-card-border);
		margin: 0.5rem 0;
		padding-left: 0.75rem;
		font-style: italic;
	}

	.post-content :global(a) {
		color: var(--color-card-link);
		text-decoration: underline;
	}

	.post-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 0.75rem 0;
		display: block;
	}
</style>
