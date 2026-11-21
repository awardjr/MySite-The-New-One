<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import AdminNav from './AdminNav.svelte';
	import SiteNav from './SiteNav.svelte';
	import type { LayoutData } from './$types';

	let { siteName = '', sections }: { siteName?: string; sections: LayoutData['sections'] } =
		$props();

	let menuOpen = $state(false);

	let inAdminArea = $derived(
		page.url.pathname === resolve('admin') || page.url.pathname.startsWith(`${resolve('admin')}/`)
	);
</script>

<header class="sticky top-0 z-50 w-full border-b border-chrome-border bg-header">
	{#if inAdminArea}
		<AdminNav bind:menuOpen />
	{:else}
		<SiteNav {siteName} {sections} bind:menuOpen />
	{/if}
</header>
