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
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Contact
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">Feel free to reach out or check out my work.</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each links as link, i (i)}
			<a
				href={link.href}
				target={link.href.startsWith('http') ? '_blank' : undefined}
				rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-900 hotdog:border-black hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
			>
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 hotdog:bg-red-600 hotdog:text-yellow-200"
				>
					<Fa icon={getIcon(link.icon)} class="h-4 w-4" />
				</span>
				<span class="font-medium">{link.label}</span>
			</a>
		{/each}
	</div>
</section>
