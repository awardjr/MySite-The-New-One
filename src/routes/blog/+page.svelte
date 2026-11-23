<script lang="ts">
	import CardAction from '#lib/components/CardAction.svelte';
	import CardImage from '#lib/components/CardImage.svelte';
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faRss } from '@fortawesome/free-solid-svg-icons';

	let { data }: PageProps = $props();
	let { posts, siteName, headline, subtitle } = $derived(data);
</script>

<PageMeta title="Posts" description={siteName ? `Posts by ${siteName}` : undefined} />

<section class="py-6 sm:py-10">
	<div class="flex items-start justify-between gap-4">
		<PageHeading {headline} {subtitle} />
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
				class="group card card-interactive block overflow-hidden"
			>
				{#if post.image}
					<CardImage src={post.image} alt={post.title} class="sm:h-64" />
				{/if}

				<div class="p-5 sm:p-6">
					<p class="card-header">
						{post.date}
					</p>
					<h2 class="mt-1 text-xl font-bold text-card-heading sm:text-2xl">
						{post.title}
					</h2>

					<p class="mt-3 text-sm text-card-copy sm:text-lg">
						{post.preview}
					</p>

					<CardAction class="mt-4">Read more</CardAction>
				</div>
			</a>
		{/each}
	</div>
</section>
