<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
	let { post, siteName } = $derived(data);
</script>

<svelte:head>
	<title>{siteName ? `${post.title} - ${siteName}` : post.title}</title>
	<meta name="description" content={post.preview} />
</svelte:head>

<section class="py-6 sm:py-10">
	<a href={resolve('/blog')} class="text-sm font-medium text-link hover:underline">
		← Back to Blog
	</a>

	<article class="mt-4 max-w-3xl">
		{#if post.draft}
			<p
				class="mb-4 rounded-lg border border-danger-border px-3 py-2 text-sm font-medium text-danger-text"
			>
				Draft preview — this post is hidden from the public blog.
			</p>
		{/if}

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
		<p class="mt-1 text-eyebrow">{post.date}</p>

		<div class="post-content mt-6 text-lg leading-relaxed text-copy">
			<!-- Sanitized on the admin page-->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html post.content}
		</div>
	</article>
</section>

<style>
	.post-content :global(p) {
		margin: 0.75rem 0;
	}

	.post-content :global(h2) {
		margin: 1.5rem 0 0.75rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-heading);
	}

	.post-content :global(h3) {
		margin: 1.25rem 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-heading);
	}

	.post-content :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin: 0.75rem 0;
	}

	.post-content :global(ol) {
		list-style: decimal;
		padding-left: 1.5rem;
		margin: 0.75rem 0;
	}

	.post-content :global(blockquote) {
		border-left: 3px solid var(--color-chrome-border);
		margin: 0.75rem 0;
		padding-left: 1rem;
		font-style: italic;
	}

	.post-content :global(a) {
		color: var(--color-link);
		text-decoration: underline;
	}

	.post-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
		display: block;
	}
</style>
