<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pressItems } = $derived(data);
</script>

<svelte:head>
	<title>Press - Arthur Ward Jr</title>
	<meta name="description" content="Press - Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Press
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">A collection of press mentions and features.</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6">
		{#each pressItems as item, i (i)}
			{#if item.href}
				<a
					href={item.href}
					target={item.href.startsWith('http') ? '_blank' : undefined}
					rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="block rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700 dark:hover:bg-gray-900 hotdog:border-black hotdog:bg-yellow-300 hotdog:hover:bg-yellow-200"
				>
					<h2 class="text-2xl font-bold text-gray-950 sm:text-3xl dark:text-gray-50 hotdog:text-black">
						{item.title}
					</h2>
					<p class="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400 hotdog:text-red-900">
						{item.summary}
					</p>
				</a>
			{:else}
				<div
					class="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950 hotdog:border-black hotdog:bg-yellow-300"
				>
					<h2 class="text-2xl font-bold text-gray-950 sm:text-3xl dark:text-gray-50 hotdog:text-black">
						{item.title}
					</h2>
					<p class="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400 hotdog:text-red-900">
						{item.summary}
					</p>
				</div>
			{/if}
		{/each}
	</div>
</section>
