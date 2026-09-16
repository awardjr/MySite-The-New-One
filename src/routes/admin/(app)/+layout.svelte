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
						? 'bg-nav-active font-semibold text-heading'
						: 'text-muted hover:bg-nav-surface-hover hover:text-admin-nav-hover'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<form method="POST" action="/admin/logout" class="mt-4">
			<button
				type="submit"
				class="w-full rounded-lg border border-card-border px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-nav-surface-hover"
			>
				Log out
			</button>
		</form>
	</aside>

	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
</div>
