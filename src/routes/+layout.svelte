<script lang="ts">
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>

	<Footer />
</div>

<style>
</style>
