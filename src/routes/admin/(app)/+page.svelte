<script lang="ts">
	import { resolve } from '$app/paths';

	const sections = [
		{
			href: resolve('/admin/home'),
			label: 'Home',
			description: 'Name, tagline, photo, and intro text.'
		},
		{
			href: resolve('/admin/contact'),
			label: 'Contact',
			description: 'Resume, LinkedIn, GitHub, email, and other links.'
		},
		{
			href: resolve('/admin/skills'),
			label: 'Skills',
			description: 'Categorized list of languages, tools, and technologies.'
		},
		{
			href: resolve('/admin/works'),
			label: 'Works',
			description: 'Projects with an image, description, and platform icons.'
		},
		{
			href: resolve('/admin/press'),
			label: 'Press',
			description: 'Press mentions shown as linkable cards.'
		},
		{
			href: resolve('/admin/pinball'),
			label: 'Pinball',
			description: 'Machines with high scores and expandable per-mode scores.'
		},
		{
			href: resolve('/admin/blog'),
			label: 'Blog',
			description: 'Blog posts, each with its own page.'
		},
		{
			href: resolve('/admin/settings'),
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
		<a
			href={section.href}
			class="block rounded-xl border border-card-border bg-card p-4 shadow-sm transition-transform duration-200 hover:scale-105 hover:border-card-border-hover hover:bg-card-hover"
		>
			<h2 class="font-semibold text-card-heading">{section.label}</h2>
			<p class="mt-1 text-sm text-card-copy">{section.description}</p>
		</a>
	{/each}
</div>
