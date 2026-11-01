<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import Lightbox from './Lightbox.svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let siteName = $derived(data.siteName);
	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<svelte:head>
	<link rel="alternate" type="application/rss+xml" title="{siteName} blog" href="/blog/rss.xml" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-page text-body transition-colors">
	<Header {siteName} />
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
	<Footer {siteName} />
	<Lightbox />
</div>
