<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pressItems, siteName, headline, subtitle } = $derived(data);
</script>

<svelte:head>
	<title>{siteName ? `Press - ${siteName}` : 'Press'}</title>
	<meta name="description" content={siteName ? `Press - ${siteName}` : 'Press'} />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
		<p class="text-lg text-muted">{subtitle}</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6">
		{#each pressItems as item, i (i)}
			{#if item.href}
				<a
					href={item.href}
					target={item.href.startsWith('http') ? '_blank' : undefined}
					rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="block rounded-xl border border-card-border bg-card p-8 shadow-sm transition-transform duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover"
				>
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold uppercase tracking-widest text-card-copy">
							{item.outlet}
						</p>
						{#if item.date}
							<p class="text-sm font-semibold uppercase tracking-widest text-card-copy">{item.date}</p>
						{/if}
					</div>
					<h2 class="mt-2 text-xl font-bold text-card-heading sm:text-2xl">
						{item.title}
					</h2>
					<p class="mt-3 text-base leading-relaxed text-card-copy">
						{item.summary}
					</p>
				</a>
			{:else}
				<div
					class="rounded-xl border border-card-border bg-card p-8 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-card-border-hover hover:bg-card-hover"
				>
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold uppercase tracking-widest text-card-copy">
							{item.outlet}
						</p>
						{#if item.date}
							<p class="text-sm font-semibold uppercase tracking-widest text-card-copy">{item.date}</p>
						{/if}
					</div>
					<h2 class="mt-2 text-xl font-bold text-card-heading sm:text-2xl">
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
