<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import Fa from 'svelte-fa';
	import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
	import { formatDate } from '#lib/formatDate.js';
	import type { PressItem } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { items, headline, subtitle } = $derived(data);
</script>

<PageMeta title="Press" />

{#snippet cardText(item: PressItem, leaveRoomForIcon: boolean)}
	{#if item.outlet || item.date}
		<p
			class={[
				'mb-1 text-xs font-semibold tracking-wider text-card-meta uppercase',
				leaveRoomForIcon && 'pr-8'
			]}
		>
			{[item.outlet, formatDate(item.date)].filter(Boolean).join(' · ')}
		</p>
	{/if}
	<h2 class={['text-2xl font-bold text-card-heading sm:text-3xl', leaveRoomForIcon && 'pr-8']}>
		{item.title}
	</h2>
	<p class="mt-3 text-base leading-relaxed text-card-copy">
		{item.summary}
	</p>
{/snippet}

<section class="py-6 sm:py-10">
	<PageHeading {headline} {subtitle} />

	<div class="mt-8 grid grid-cols-1 gap-6">
		{#each items as item, i (i)}
			{#if item.href}
				{@const external = item.href.startsWith('http')}
				<a
					href={item.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="group card card-interactive relative block p-6 sm:p-8"
				>
					{#if external}
						<span
							title="Opens an external site"
							class="absolute top-5 right-5 text-card-action transition-colors group-hover:text-card-heading"
						>
							<Fa icon={faArrowUpRightFromSquare} class="h-4 w-4" />
						</span>
					{/if}
					{@render cardText(item, external)}
				</a>
			{:else}
				<div class="card p-6 sm:p-8">
					{@render cardText(item, false)}
				</div>
			{/if}
		{/each}
	</div>
</section>
