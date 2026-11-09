<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { getIcon } from '#lib/icons.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { links, siteName, headline, subtitle } = $derived(data);

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
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
		<p class="text-base text-muted">{subtitle}</p>
	</div>

	<div class="mt-8 flex w-full flex-col gap-3 md:max-w-xl">
		{#each links as link, i (i)}
			<a
				href={link.href}
				target={link.href.startsWith('http') ? '_blank' : undefined}
				rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
				style:--link-color={iconColors[link.icon] ?? iconColors.link}
				class="group card card-interactive flex items-center gap-3 px-4 py-3 text-card-label hover:border-transparent hover:bg-(--link-color) hover:text-white"
			>
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--link-color) text-white ring-1 ring-white/15 transition-colors duration-200 ring-inset group-hover:bg-white/20"
				>
					<Fa icon={getIcon(link.icon)} class="h-4 w-4" />
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
</section>
