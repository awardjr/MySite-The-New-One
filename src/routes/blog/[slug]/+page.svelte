<script lang="ts">
	import PageMeta from '#lib/components/PageMeta.svelte';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import { formatDate } from '#lib/formatDate.js';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
	let { post } = $derived(data);
</script>

<PageMeta
	title={post.title}
	description={post.preview}
	image={post.image}
	publishedDate={post.date}
	noindex={post.draft}
/>

<section class="py-6 sm:py-10">
	<a href={resolve('blog')} class="text-sm font-medium text-link hover:underline">← Back to Blog</a>

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
		<p class="mt-1 text-eyebrow">{formatDate(post.date)}</p>

		<div class="post-content mt-6 text-lg leading-relaxed text-copy">
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

	.post-content :global(h4) {
		margin: 1rem 0 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-heading);
	}

	.post-content :global(hr) {
		margin: 2rem 0;
		border-top: 1px solid var(--color-chrome-border);
	}

	.post-content :global(code) {
		padding: 0.1em 0.3em;
		border: 1px solid var(--color-card-border);
		border-radius: 0.25rem;
		background: var(--color-card);
		color: var(--color-card-heading);
		font-size: 0.875em;
	}

	.post-content :global(pre) {
		margin: 1rem 0;
		padding: 1rem;
		overflow-x: auto;
		border: 1px solid var(--color-card-border);
		border-radius: 0.5rem;
		background: var(--color-card);
		color: var(--color-card-heading);
		font-size: 0.875em;
	}

	.post-content :global(pre code) {
		padding: 0;
		border: 0;
		background: none;
		font-size: inherit;
	}

	.post-content :global(.marker-yellow) {
		background: #fdfd77;
		color: #111827;
	}

	.post-content :global(.marker-green) {
		background: #62f962;
		color: #111827;
	}

	.post-content :global(.marker-pink) {
		background: #fc7899;
		color: #111827;
	}

	.post-content :global(.marker-blue) {
		background: #72ccfd;
		color: #111827;
	}

	.post-content :global(.pen-red) {
		background: none;
		color: var(--color-error);
		font-weight: 700;
	}

	.post-content :global(.pen-green) {
		background: none;
		color: var(--color-success);
		font-weight: 700;
	}

	.post-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
	}

	.post-content :global(figure.image) {
		display: table;
		clear: both;
		margin: 1.25rem auto;
		text-align: center;
	}

	.post-content :global(figure.image img) {
		display: block;
		margin: 0 auto;
	}

	.post-content :global(figure.image_resized) {
		display: block;
		max-width: 100%;
	}

	.post-content :global(figure.image_resized img) {
		width: 100%;
	}

	.post-content :global(figure.image > figcaption) {
		display: table-caption;
		caption-side: bottom;
	}

	.post-content :global(figure.image_resized > figcaption) {
		display: block;
	}

	.post-content :global(figcaption) {
		padding: 0.5rem;
		color: var(--color-muted);
		font-size: 0.875rem;
		text-align: center;
	}

	.post-content :global(figure.image.image-style-align-left),
	.post-content :global(img.image-style-align-left) {
		float: left;
		clear: none;
		max-width: 50%;
		margin: 0.25rem 1.5rem 1rem 0;
	}

	.post-content :global(figure.image.image-style-align-right),
	.post-content :global(img.image-style-align-right) {
		float: right;
		clear: none;
		max-width: 50%;
		margin: 0.25rem 0 1rem 1.5rem;
	}

	.post-content :global(figure.image.image-style-block-align-left) {
		margin-left: 0;
	}

	.post-content :global(figure.image.image-style-block-align-right) {
		margin-right: 0;
	}

	/* Keeps floated images inside the post. */
	.post-content::after {
		content: '';
		display: block;
		clear: both;
	}

	/* Wide tables scroll sideways instead of stretching the page. */
	.post-content :global(figure.table) {
		display: block;
		margin: 1.25rem 0;
		overflow-x: auto;
	}

	.post-content :global(table) {
		width: 100%;
		border-collapse: collapse;
	}

	.post-content :global(table.ck-table-resized) {
		table-layout: fixed;
	}

	.post-content :global(th),
	.post-content :global(td) {
		min-width: 2em;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-card-border);
		text-align: left;
		vertical-align: top;
		overflow-wrap: break-word;
	}

	.post-content :global(th) {
		background: var(--color-badge);
		color: var(--color-heading);
		font-weight: 600;
	}

	.post-content :global(td > p:first-child),
	.post-content :global(th > p:first-child) {
		margin-top: 0;
	}

	.post-content :global(td > p:last-child),
	.post-content :global(th > p:last-child) {
		margin-bottom: 0;
	}
</style>
