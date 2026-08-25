<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div
	class="flex min-h-screen flex-col bg-white text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100"
>
	<Header />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
		{@render children()}
	</main>
	<Footer />
</div>
