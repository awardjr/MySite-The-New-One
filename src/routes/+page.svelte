<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { name, tagline, photoSrc, introParagraphs } = $derived(data.home);
</script>

<svelte:head>
	<title>Home - {name}</title>
	<meta content="Personal Website for {name}" name="description" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div
		class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12"
	>
		<!-- Text Introduction Section -->
		<div class="flex-1 space-y-4 text-center md:text-left">
			<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">
				Hi, I'm {name}
			</h1>

			<p class="text-lg font-medium text-copy sm:text-2xl">
				{tagline}
			</p>

			<div class="space-y-3 text-lg leading-relaxed text-muted">
				{#each introParagraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>

		<!-- Photo Section -->
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
	</div>
</section>

{#if data.featuredPosts.length}
	<section class="py-6">
		<h2 class="text-2xl font-bold tracking-tight text-heading">Featured Posts</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each data.featuredPosts as post (post.slug)}
				<a
					href="/blog/{post.slug}"
					class="block rounded-xl border border-card-border bg-card p-4 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover"
				>
					{#if post.image}
						<img src={post.image} alt={post.title} class="mb-3 h-40 w-full rounded-lg object-cover" />
					{/if}
					<h3 class="line-clamp-2 text-lg font-semibold text-card-heading">{post.title}</h3>
					<p class="text-sm text-card-meta">{post.date}</p>
					<p class="mt-2 line-clamp-3 text-base text-card-copy">{post.preview}</p>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if data.featuredWorks.length}
	<section class="py-6">
		<h2 class="text-2xl font-bold tracking-tight text-heading">Featured Works</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each data.featuredWorks as work (work.id)}
				<a
					href="/works#work-{work.id}"
					class="block rounded-xl border border-card-border bg-card p-4 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover"
				>
					{#if work.image}
						<img src={work.image} alt={work.title} class="mb-3 h-40 w-full rounded-lg object-cover" />
					{/if}
					<h3 class="line-clamp-2 text-lg font-semibold text-card-heading">{work.title}</h3>
					<p class="mt-1 line-clamp-3 text-base text-card-copy">{work.description}</p>
				</a>
			{/each}
		</div>
	</section>
{/if}
