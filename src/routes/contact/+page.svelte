<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import { fly } from 'svelte/transition';
	import Fa from 'svelte-fa';
	import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { getIcon } from '#lib/icons.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { links, siteName, headline, subtitle } = $derived(data);

	let hoveredIndex: number | null = $state(null);
	let hovered = $derived(hoveredIndex === null ? undefined : links[hoveredIndex]);
</script>

<PageMeta title="Contact" description={siteName ? `Contact ${siteName}` : undefined} />

<section class="py-6 sm:py-10">
	<PageHeading {headline} {subtitle} />

	<div class="mt-8 flex w-full flex-col gap-3 lg:flex-row lg:items-start">
		<div
			class="flex w-full flex-col gap-3 lg:w-3/5"
			role="presentation"
			onmouseleave={() => (hoveredIndex = null)}
		>
			{#each links as link, i (i)}
				{@const { icon, color } = getIcon(link.icon)}
				<a
					href={link.href}
					target={link.href.startsWith('http') ? '_blank' : undefined}
					rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					style:--link-color={color}
					onmouseenter={() => (hoveredIndex = i)}
					class="group card card-interactive flex items-center gap-3 px-4 py-3 text-card-label hover:border-transparent hover:bg-(--link-color) hover:text-white"
				>
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--link-color) text-white ring-1 ring-white/15 transition-colors duration-200 ring-inset group-hover:bg-white/20"
					>
						<Fa {icon} class="h-4 w-4" />
					</span>
					<span class="font-medium">{link.label}</span>
					<span
						class="ml-auto opacity-40 transition duration-200 group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5"
					>
						<Fa icon={faArrowRight} class="h-3.5 w-3.5" />
					</span>
				</a>
			{/each}
		</div>

		<div class="hidden lg:block lg:w-2/5 lg:pl-8">
			{#if hovered?.description}
				<div
					transition:fly={{ duration: 200, x: -40, y: 0 }}
					style:--link-color={getIcon(hovered.icon).color}
					class="sticky top-24 rounded-xl bg-(--link-color) p-6 text-white shadow-md transition-colors duration-200"
				>
					<p class="text-base leading-relaxed">
						{hovered.description}
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>
