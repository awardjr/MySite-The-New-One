<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import Lightbox from './Lightbox.svelte';
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let siteName = $derived(data.siteName);
</script>

<div class="flex min-h-screen flex-col bg-page text-body transition-colors">
	<Header {siteName} />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>
	<Footer {siteName} />
	<Lightbox />
</div>
