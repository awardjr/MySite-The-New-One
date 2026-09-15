<script lang="ts">
	const sections = [
		{ href: '/admin/home', label: 'Home', description: 'Name, tagline, photo, and intro text.' },
		{ href: '/admin/contact', label: 'Contact', description: 'Resume, LinkedIn, GitHub, email, and other links.' },
		{ href: '/admin/skills', label: 'Skills', description: 'Categorized list of languages, tools, and technologies.' },
		{ href: '/admin/works', label: 'Works', description: 'Projects with an image, description, and platform icons.' },
		{ href: '/admin/press', label: 'Press', description: 'Press mentions shown as linkable cards.' },
		{ href: '/admin/pinball', label: 'Pinball', description: 'Machines with high scores and expandable per-mode scores.' },
		{ href: '/admin/blog', label: 'Blog', description: 'Blog posts, each with its own page.' },
		{ href: '/admin/settings', label: 'Settings', description: 'Change the admin password.' }
	];
</script>

<svelte:head>
	<title>Admin - Dashboard</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Dashboard</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Pick a section below to edit its content. Changes are saved immediately and go live right away.
</p>

<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each sections as section (section.href)}
		<a
			href={section.href}
			class="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700 dark:hover:bg-gray-900 hotdog:border-black hotdog:bg-yellow-300 hotdog:hover:bg-yellow-200"
		>
			<h2 class="font-semibold text-gray-950 dark:text-gray-50 hotdog:text-black">{section.label}</h2>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-red-900">{section.description}</p>
		</a>
	{/each}
</div>
