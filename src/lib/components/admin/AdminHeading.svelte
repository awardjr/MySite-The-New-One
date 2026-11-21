<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<svelte:head>
	<title>Admin - {title}</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">{title}</h1>
{#if children}
	<p class="mt-1 text-sm text-muted">{@render children()}</p>
{/if}
