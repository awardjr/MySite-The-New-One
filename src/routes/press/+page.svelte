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
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Press</h1>
		<p class="text-base text-muted">A collection of press mentions and features.</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6">
		{#each pressItems as item, i (i)}
			{#if item.href}
				<a
					href={item.href}
					target={item.href.startsWith('http') ? '_blank' : undefined}
					rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="block rounded-xl border border-card-border bg-card p-8 shadow-sm transition-colors hover:border-card-border-hover hover:bg-card-hover"
				>
					<h2 class="text-2xl font-bold text-card-heading sm:text-3xl">
						{item.title}
					</h2>
					<p class="mt-3 text-base leading-relaxed text-card-copy">
						{item.summary}
					</p>
				</a>
			{:else}
				<div class="rounded-xl border border-card-border bg-card p-8 shadow-sm">
					<h2 class="text-2xl font-bold text-card-heading sm:text-3xl">
						{item.title}
					</h2>
					<p class="mt-3 text-base leading-relaxed text-card-copy">
						{item.summary}
					</p>
				</div>
			{/if}
		{/each}
	</div>
</section>
