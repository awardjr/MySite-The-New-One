<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faArrowRight, faRss } from '@fortawesome/free-solid-svg-icons';

	let { data }: PageProps = $props();
	let { posts, siteName, headline, subtitle } = $derived(data);
</script>

<svelte:head>
	<title>{siteName ? `Posts - ${siteName}` : 'Posts'}</title>
	<meta name="description" content={siteName ? `Posts by ${siteName}` : 'Posts'} />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
			<p class="text-lg text-muted">{subtitle}</p>
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
				class="group card card-interactive block overflow-hidden"
			>
				{#if post.image}
					<div class="h-48 overflow-hidden border-b border-card-border sm:h-64">
						<img
							src={post.image}
							alt={post.title}
							class="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
						/>
					</div>
				{/if}

				<div class="p-5 sm:p-6">
					<p class="text-xs font-semibold tracking-wider text-card-meta uppercase">{post.date}</p>
					<h2 class="mt-1 text-xl font-bold text-card-heading sm:text-2xl">
						{post.title}
					</h2>

					<p class="mt-3 text-sm text-card-copy sm:text-lg">
						{post.preview}
					</p>

					<span
						class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-card-action transition-colors group-hover:text-card-heading"
					>
						Read more
						<span class="transition-transform duration-200 motion-safe:group-hover:translate-x-1">
							<Fa icon={faArrowRight} class="h-3 w-3" />
						</span>
					</span>
				</div>
			</a>
		{/each}
	</div>
</section>
