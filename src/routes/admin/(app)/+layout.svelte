<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/home', label: 'Home' },
		{ href: '/admin/contact', label: 'Contact' },
		{ href: '/admin/skills', label: 'Skills' },
		{ href: '/admin/works', label: 'Works' },
		{ href: '/admin/press', label: 'Press' },
		{ href: '/admin/pinball', label: 'Pinball' },
		{ href: '/admin/blog', label: 'Blog' },
		{ href: '/admin/settings', label: 'Settings' }
	];
</script>

<div class="flex min-h-[calc(100vh-8rem)] flex-col gap-6 py-6 sm:flex-row sm:py-10">
	<aside class="shrink-0 sm:w-48">
		<nav class="flex flex-row flex-wrap gap-1 sm:flex-col">
			{#each navItems as item (item.href)}
				{@const isActive = page.url.pathname === item.href}
				<a
					href={item.href}
					class="rounded-lg px-3 py-2 text-sm transition-colors {isActive
						? 'bg-gray-100 font-semibold text-gray-950 dark:bg-gray-900 dark:text-gray-50 hotdog:bg-red-800 hotdog:text-yellow-300'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100 hotdog:text-yellow-100 hotdog:hover:bg-red-800'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<form method="POST" action="/admin/logout" class="mt-4">
			<button
				type="submit"
				class="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 hotdog:border-black hotdog:text-yellow-100 hotdog:hover:bg-red-800"
			>
				Log out
			</button>
		</form>
	</aside>

	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
</div>
