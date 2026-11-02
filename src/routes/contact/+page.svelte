<script lang="ts">
	import Fa from 'svelte-fa';
	import { getIcon } from '$lib/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { links, siteName } = $derived(data);

	const iconColors: Record<string, string> = {
		resume: '#475569',
		email: '#dc2626',
		phone: '#16a34a',
		link: '#0d9488',
		linkedin: '#0a66c2',
		github: '#24292f',
		twitch: '#9146ff',
		youtube: '#e11d48'
	};
</script>

<svelte:head>
	<title>{siteName ? `Contact - ${siteName}` : 'Contact'}</title>
	<meta name="description" content={siteName ? `Contact ${siteName}` : 'Contact'} />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Contact</h1>
		<p class="text-base text-muted">Find me in these places. Check out what I've done as well</p>
	</div>

	<div class="mx-auto mt-8 flex w-full flex-col gap-3 md:w-2/3">
		{#each links as link, i (i)}
			<a
				href={link.href}
				target={link.href.startsWith('http') ? '_blank' : undefined}
				rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				style:--link-color={iconColors[link.icon] ?? iconColors.link}
				class="group flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3 text-card-label shadow-sm transition duration-200 hover:scale-105 hover:border-transparent hover:bg-(--link-color) hover:text-white"
			>
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--link-color) text-white transition-colors duration-200 group-hover:bg-white/20"
				>
					<Fa icon={getIcon(link.icon)} class="h-4 w-4" />
				</span>
				<span class="font-medium">{link.label}</span>
			</a>
		{/each}
	</div>
</section>
