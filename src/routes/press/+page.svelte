<script lang="ts">
	import CardAction from '#lib/components/CardAction.svelte';
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import ExternalLinkIcon from '#lib/components/ExternalLinkIcon.svelte';
	import { linkHost } from '#lib/linkHost.js';
	import type { PressItem } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { items, headline, subtitle } = $derived(data);
</script>

<PageMeta title="Press" />

{#snippet cardText(item: PressItem, leaveRoomForIcon: boolean)}
	{#if item.outlet || item.date}
		<p class={['mb-1 card-header', leaveRoomForIcon && 'pr-8']}>
			{#if item.outlet}
				<span>{item.outlet}</span>
			{/if}
			{#if item.outlet && item.date}
				<span>·</span>
			{/if}
			{#if item.date}
				<span class="whitespace-nowrap">{item.date}</span>
			{/if}
		</p>
	{/if}
	<h2 class={['text-xl font-bold text-card-heading sm:text-2xl', leaveRoomForIcon && 'pr-8']}>
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
				{@const host = linkHost(item.href)}
				<a
					href={item.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="group card card-interactive relative block p-6 sm:p-8"
				>
					{#if external}
						<ExternalLinkIcon href={item.href} class="top-5 right-5" />
					{/if}
					{@render cardText(item, external)}
					<CardAction class="mt-4">{host ? `Read on ${host}` : 'Read more'}</CardAction>
				</a>
			{:else}
				<div class="card p-6 sm:p-8">
					{@render cardText(item, false)}
				</div>
			{/if}
		{/each}
	</div>
</section>
