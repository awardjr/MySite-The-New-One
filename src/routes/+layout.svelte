<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import Lightbox from '#lib/components/Lightbox.svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import type { Snapshot } from '@sveltejs/kit';
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let siteName = $derived(data.siteName);
	let scroller: HTMLDivElement | undefined = $state();

	export const snapshot: Snapshot<number> = {
		capture: () => scroller?.scrollTop ?? 0,
		restore: (top) => scroller?.scrollTo(0, top)
	};

	afterNavigate(({ from, to, type }) => {
		if (type === 'popstate') return;
		if (from?.url.pathname !== to?.url.pathname && !to?.url.hash) scroller?.scrollTo(0, 0);
	});

	let paintFooterBand = $state(false);
	$effect(() => {
		const footer = scroller?.querySelector('footer');
		if (!scroller || !footer) return;
		const area = scroller;
		const footerElement = footer;
		paintFooterBand = !CSS.supports('-moz-appearance', 'none');

		function update() {
			const height = footerElement.offsetHeight;
			const onScreen =
				area.getBoundingClientRect().bottom - footerElement.getBoundingClientRect().top;
			area.style.setProperty('--footer-height', `${height}px`);
			area.style.setProperty('--footer-visible', `${Math.min(Math.max(onScreen, 0), height)}px`);
		}

		const observer = new ResizeObserver(update);
		observer.observe(footer);
		observer.observe(area);
		area.addEventListener('scroll', update, { passive: true });
		return () => {
			observer.disconnect();
			area.removeEventListener('scroll', update);
		};
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
	<div
		bind:this={scroller}
		class={['page-scroller flex flex-1 flex-col overflow-y-auto', paintFooterBand && 'footer-band']}
	>
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
	</div>
	<Lightbox />
</div>
