<script lang="ts">
	import CardImage from '#lib/components/CardImage.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import { openLightbox } from '#lib/lightbox.svelte.js';
	import { formatDate } from '#lib/formatDate.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { name, tagline, photoSrc, introParagraphs } = $derived(data.home);
	let { headline } = $derived(data);
</script>

<PageMeta title="Home" description={`Personal Website for ${name}`} />

<section class="py-6 sm:py-10">
	<div
		class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12"
	>
		<div class="flex-1 space-y-4 text-center md:text-left">
			<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
				{headline}
				{name}
			</h1>

			{#if tagline}
				<p class="text-lg font-medium text-copy sm:text-2xl">
					{tagline}
				</p>
			{/if}

			<div class="space-y-3 text-lg leading-relaxed text-muted">
				{#each introParagraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>

		{#if photoSrc}
			<div class="flex shrink-0 justify-center">
				<button
					aria-label={`View larger photo of ${name}`}
					onclick={() => openLightbox(photoSrc, name)}
					type="button"
				>
					<img
						alt={name}
						class="h-72 w-72 cursor-pointer rounded-2xl object-cover shadow-md sm:h-96 sm:w-96"
						src={photoSrc}
					/>
				</button>
			</div>
		{/if}
	</div>
</section>

{#snippet featureCard(
	href: string,
	image: string | undefined,
	title: string,
	body: string,
	meta?: string
)}
	<a {href} class="group card card-interactive flex flex-col overflow-hidden">
		{#if image}
			<CardImage src={image} alt={title} />
		{/if}
		<div class="p-5">
			{#if meta}
				<p class="mb-1 card-header">{meta}</p>
			{/if}
			<h3 class="line-clamp-2 text-lg font-semibold text-card-heading">{title}</h3>
			<p class="mt-2 line-clamp-3 text-base text-card-copy">{body}</p>
		</div>
	</a>
{/snippet}

{#if data.featuredPosts.length}
	<section class="py-6">
		<h2 class="text-2xl font-bold tracking-tight text-heading">Featured Posts</h2>
		<div class="mt-4 grid gap-5 sm:grid-cols-2">
			{#each data.featuredPosts as post (post.slug)}
				{@render featureCard(
					`/blog/${post.slug}`,
					post.image,
					post.title,
					post.preview,
					formatDate(post.date)
				)}
			{/each}
		</div>
	</section>
{/if}

{#if data.featuredWorks.length}
	<section class="py-6">
		<h2 class="text-2xl font-bold tracking-tight text-heading">Featured Works</h2>
		<div class="mt-4 grid gap-5 sm:grid-cols-2">
			{#each data.featuredWorks as work (work.id)}
				{@render featureCard(`/works#work-${work.id}`, work.image, work.title, work.description)}
			{/each}
		</div>
	</section>
{/if}
