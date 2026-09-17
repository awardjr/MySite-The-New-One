<script lang="ts">
	import Fa from 'svelte-fa';
	import { getIcon } from '$lib/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { links } = $derived(data);
</script>

<svelte:head>
	<title>Contact - Arthur Ward Jr</title>
	<meta name="description" content="Contact Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Contact</h1>
		<p class="text-base text-muted">Find me in these places. Check out what I've done as well</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each links as link, i (i)}
			<a
				href={link.href}
				target={link.href.startsWith('http') ? '_blank' : undefined}
				rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				class="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3 text-card-label shadow-sm transition-transform duration-200 hover:scale-105 hover:border-card-border-hover hover:bg-card-hover"
			>
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-badge text-badge-text"
				>
					<Fa icon={getIcon(link.icon)} class="h-4 w-4" />
				</span>
				<span class="font-medium">{link.label}</span>
			</a>
		{/each}
	</div>
</section>
