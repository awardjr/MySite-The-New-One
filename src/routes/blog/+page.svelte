<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faRss } from '@fortawesome/free-solid-svg-icons';

	let { data }: PageProps = $props();
	let { posts, siteName } = $derived(data);

</script>

<svelte:head>
	<title>{siteName ? `Posts - ${siteName}` : 'Posts'}</title>
	<meta name="description" content={siteName ? `Posts by ${siteName}` : 'Posts'} />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Blog</h1>
			<p class="text-lg text-muted">Musings perhaps</p>
		</div>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a
			href="/blog/rss.xml"
			data-sveltekit-reload
			title="RSS feed"
			aria-label="RSS feed"
			class="mt-2 text-muted transition-colors hover:text-heading"
		>
			<Fa icon={faRss} class="h-5 w-5" />
		</a>
	</div>

	<div class="mt-8 space-y-6">
		{#each posts as post (post.slug)}
			<a
				href={resolve('/blog/[slug]', { slug: post.slug })}
				class="block rounded-xl border border-card-border bg-card p-5 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover"
			>
				{#if post.image}
					<img
						src={post.image}
						alt={post.title}
						class="mb-4 h-48 w-full rounded-lg object-cover ring-1 ring-card-ring sm:h-64"
					/>
				{/if}

				<h2 class="text-xl font-bold text-card-heading sm:text-2xl">
					{post.title}
				</h2>
				<p class="mt-1 text-card-meta">{post.date}</p>

				<p class="mt-3 text-sm text-card-copy sm:text-lg">
					{post.preview}
				</p>

				<div class="mt-4 flex justify-end">
					<span
						class="inline-flex items-center rounded-lg border border-card-border px-3 py-1.5 text-sm text-card-action transition-colors hover:border-card-border-hover hover:bg-card-border"
					>
						Read More
					</span>
				</div>
			</a>
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
