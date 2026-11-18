<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import MenuButton from './MenuButton.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { menuOpen = $bindable() }: { menuOpen: boolean } = $props();

	const adminNavItems = [
		{ href: resolve('admin'), label: 'Dashboard' },
		{ href: resolve('admin/home'), label: 'Home' },
		{ href: resolve('admin/blog'), label: 'Blog' },
		{ href: resolve('admin/contact'), label: 'Contact' },
		{ href: resolve('admin/works'), label: 'Works' },
		{ href: resolve('admin/press'), label: 'Press' },
		{ href: resolve('admin/pinball'), label: 'Pinball' },
		{ href: resolve('admin/settings'), label: 'Settings' }
	];

	let isAuthPage = $derived(
		page.url.pathname === resolve('admin/login') ||
			page.url.pathname === resolve('admin/setup') ||
			page.url.pathname === resolve('admin/forgot-password') ||
			page.url.pathname === resolve('admin/reset')
	);

	function isAdminItemActive(href: string): boolean {
		return href === resolve('admin')
			? page.url.pathname === href
			: page.url.pathname.startsWith(href);
	}

	function closeMobileMenu() {
		menuOpen = false;
	}
</script>

<div class="mx-auto flex h-16 max-w-7/10 max-lg:max-w-none items-center justify-between px-4">
	<!-- Burger menu - left on mobile, hidden on desktop -->
	{#if !isAuthPage}
		<div class="flex lg:hidden">
			<MenuButton label="Toggle admin navigation menu" bind:open={menuOpen} />
		</div>
	{/if}

	<!-- Center: Dashboard link on mobile, Back to site + nav on desktop -->
	<div class="flex items-center gap-3 lg:gap-4">
		<a
			href={resolve('/')}
			onclick={closeMobileMenu}
			class="inline-flex items-center gap-1.5 rounded-lg border border-menu-border px-3 py-1.5 text-xs sm:text-sm font-medium text-nav-text transition-colors hover:bg-nav-surface-hover hover:text-heading"
			><span aria-hidden="true">←</span> Back to site</a
		>

		{#if !isAuthPage}
			<nav class="hidden lg:flex lg:items-center lg:gap-1">
				{#each adminNavItems as item (item.href)}
					{@const isActive = isAdminItemActive(item.href)}
					<a
						href={item.href}
						class="rounded-lg px-2.5 py-1.5 text-xl transition-colors {isActive
							? 'bg-nav-active font-semibold text-heading'
							: 'text-nav-text hover:bg-nav-surface-hover hover:text-admin-nav-hover'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>

	<!-- Theme toggle - right -->
	<div class="flex items-center gap-2">
		{#if !isAuthPage}
			<form method="POST" action={resolve('admin/logout')} class="hidden sm:block">
				<button
					type="submit"
					class="rounded-lg border border-menu-border px-3 py-1.5 text-xs sm:text-sm text-nav-text transition-colors hover:bg-nav-surface-hover hover:text-heading"
				>
					Log out
				</button>
			</form>
		{/if}

		<ThemeToggle />
	</div>
</div>

{#if menuOpen}
	<nav
		transition:slide|global={{ duration: 150 }}
		class="border-t border-chrome-border px-4 py-3 lg:hidden"
	>
		<div class="flex flex-col gap-2">
			<a
				href={resolve('/')}
				onclick={closeMobileMenu}
				class="inline-flex items-center gap-1.5 rounded-lg border border-menu-border px-3 py-2 text-sm font-medium text-nav-text transition-colors hover:bg-nav-surface-hover hover:text-heading"
				><span aria-hidden="true">←</span> Back to site</a
			>

			{#if !isAuthPage}
				{#each adminNavItems as item (item.href)}
					{@const isActive = isAdminItemActive(item.href)}
					<a
						href={item.href}
						onclick={closeMobileMenu}
						class="rounded-lg px-3 py-2 text-sm transition-colors {isActive
							? 'bg-nav-active font-semibold text-heading'
							: 'text-nav-text hover:bg-nav-surface-hover hover:text-admin-nav-hover'}"
					>
						{item.label}
					</a>
				{/each}
				<form
					method="POST"
					action={resolve('admin/logout')}
					class="pt-2 border-t border-chrome-border"
				>
					<button
						type="submit"
						class="w-full rounded-lg border border-menu-border px-3 py-2 text-left text-sm text-nav-text transition-colors hover:bg-nav-surface-hover hover:text-heading"
					>
						Log out
					</button>
				</form>
			{/if}
		</div>
	</nav>
{/if}
