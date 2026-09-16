<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import Lightbox from './Lightbox.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-page text-body transition-colors">
	<Header />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>
	<Footer />
	<Lightbox />
</div>
