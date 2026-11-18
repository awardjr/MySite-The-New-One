<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import Lightbox from '#lib/components/Lightbox.svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let siteName = $derived(data.siteName);
	let scroller: HTMLDivElement | undefined = $state();

	// Pages scroll inside this container, which SvelteKit's own scroll reset doesn't reach. A link
	// to a spot on a page (`#...`) is left alone, because SvelteKit scrolls to that spot itself.
	afterNavigate(({ from, to }) => {
		if (from?.url.pathname !== to?.url.pathname && !to?.url.hash) scroller?.scrollTo(0, 0);
	});
	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<svelte:head>
	{#if page.error}
		<title>{siteName ? `${page.error.message} - ${siteName}` : page.error.message}</title>
	{/if}
	<link rel="alternate" type="application/rss+xml" title="{siteName} blog" href="/blog/rss.xml" />
</svelte:head>

<div class="flex h-screen flex-col bg-page text-body transition-colors overflow-hidden">
	<Header {siteName} sections={data.sections} />
	<div bind:this={scroller} class="flex flex-1 flex-col overflow-y-auto">
		<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
			<div class="grid">
				{#key page.url.pathname}
					<div
						class="col-start-1 row-start-1"
						in:fade={{ duration: reduceMotion ? 0 : 100 }}
						out:fade={{ duration: reduceMotion ? 0 : 100 }}
					>
						{@render children()}
					</div>
				{/key}
			</div>
		</main>
	</div>
	<Footer {siteName} />
	<Lightbox />
</div>
