<script lang="ts">
	const sections = [
		{ href: '/admin/home', label: 'Home', description: 'Name, tagline, photo, and intro text.' },
		{
			href: '/admin/contact',
			label: 'Contact',
			description: 'Resume, LinkedIn, GitHub, email, and other links.'
		},
		{
			href: '/admin/skills',
			label: 'Skills',
			description: 'Categorized list of languages, tools, and technologies.'
		},
		{
			href: '/admin/works',
			label: 'Works',
			description: 'Projects with an image, description, and platform icons.'
		},
		{
			href: '/admin/press',
			label: 'Press',
			description: 'Press mentions shown as linkable cards.'
		},
		{
			href: '/admin/pinball',
			label: 'Pinball',
			description: 'Machines with high scores and expandable per-mode scores.'
		},
		{ href: '/admin/blog', label: 'Blog', description: 'Blog posts, each with its own page.' },
		{ href: '/admin/settings', label: 'Settings', description: 'Change the admin password.' }
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
			class="block rounded-xl border border-card-border bg-card p-4 shadow-sm transition-colors hover:border-card-border-hover hover:bg-card-hover"
		>
			<h2 class="font-semibold text-card-heading">{section.label}</h2>
			<p class="mt-1 text-sm text-card-copy">{section.description}</p>
		</a>
	{/each}
</div>
