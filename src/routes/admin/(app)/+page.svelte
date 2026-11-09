<script lang="ts">
	import { resolve } from '$app/paths';

	const sections = [
		{
			href: resolve('admin/home'),
			label: 'Home',
			description: 'Headline, name, tagline, photo, and intro text.'
		},
		{
			href: resolve('admin/contact'),
			label: 'Contact',
			description: 'Headline, subtitle, and contact links.'
		},
		{
			href: resolve('admin/works'),
			label: 'Works',
			description: 'Headline, subtitle, and project cards.'
		},
		{
			href: resolve('admin/press'),
			label: 'Press',
			description: 'Headline, subtitle, and press mentions.'
		},
		{
			href: resolve('admin/pinball'),
			label: 'Pinball',
			description: 'Headline, subtitle, and pinball machines.'
		},
		{
			href: resolve('admin/blog'),
			label: 'Blog',
			description: 'Headline, subtitle, and blog posts.'
		},
		{
			href: resolve('admin/settings'),
			label: 'Settings',
			description: 'Change the admin password.'
		}
	];
</script>

<svelte:head>
	<title>Admin - Dashboard</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Dashboard</h1>

<p class="mt-1 text-sm text-muted">
	Pick a section below to edit its content. Changes are saved immediately and go live right away.
</p>

<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each sections as section (section.href)}
		<a href={section.href} class="card card-interactive block p-4">
			<h2 class="font-semibold text-card-heading">{section.label}</h2>
			<p class="mt-1 text-sm text-card-copy">{section.description}</p>
		</a>
	{/each}
</div>
