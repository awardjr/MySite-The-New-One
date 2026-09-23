<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faBars, faBurger, faHotdog, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

	type Theme = 'light' | 'dark' | 'hotdog';

	let { siteName = '' }: { siteName?: string } = $props();

	let theme: Theme = $state('light');
	let isMobileMenuOpen = $state(false);

	const navItems = [
		{ href: resolve('/'), label: 'Home' },
		{ href: resolve('/blog'), label: 'Posts' },
		{ href: resolve('/press'), label: 'Press' },
		{ href: resolve('/works'), label: 'Works' },
		{ href: resolve('/skills'), label: 'Skills' },
		{ href: resolve('/pinball'), label: 'Pinball' },
		{ href: resolve('/contact'), label: 'Contact' }
	];

	const adminNavItems = [
		{ href: resolve('/admin'), label: 'Dashboard' },
		{ href: resolve('/admin/home'), label: 'Home' },
		{ href: resolve('/admin/blog'), label: 'Blog' },
		{ href: resolve('/admin/contact'), label: 'Contact' },
		{ href: resolve('/admin/skills'), label: 'Skills' },
		{ href: resolve('/admin/works'), label: 'Works' },
		{ href: resolve('/admin/press'), label: 'Press' },
		{ href: resolve('/admin/pinball'), label: 'Pinball' },
		{ href: resolve('/admin/settings'), label: 'Settings' }
	];

	let isAdmin = $derived(
		page.url.pathname === resolve('/admin') || page.url.pathname.startsWith(`${resolve('/admin')}/`)
	);
	let isAuthPage = $derived(
		page.url.pathname === resolve('/admin/login') ||
			page.url.pathname === resolve('/admin/setup') ||
			page.url.pathname === resolve('/admin/forgot-password') ||
			page.url.pathname === resolve('/admin/reset')
	);

	const themeOrder: Theme[] = ['light', 'dark', 'hotdog'];

	function isAdminItemActive(href: string): boolean {
		return href === resolve('/admin')
			? page.url.pathname === href
			: page.url.pathname.startsWith(href);
	}

	onMount(() => {
		if (document.documentElement.classList.contains('hotdog')) {
			theme = 'hotdog';
		} else if (document.documentElement.classList.contains('light')) {
			theme = 'light';
		} else {
			theme = 'dark';
		}
	});

	function toggleTheme() {
		const nextTheme = (themeOrder.indexOf(theme) + 1) % themeOrder.length;
		theme = themeOrder[nextTheme];
		document.documentElement.classList.remove('dark', 'hotdog');
		if (theme !== 'light') {
			document.documentElement.classList.add(theme);
		}
		localStorage.setItem('theme', theme);
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
</script>

<header class="sticky top-0 z-50 w-full border-b border-chrome-border bg-header">
	<div class="mx-auto flex h-16 max-w-7/10 items-center justify-between px-4">
		{#if isAdmin}
			<div class="flex items-center gap-3 lg:gap-4">
				<a
					href={resolve('/')}
					onclick={closeMobileMenu}
					class="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs sm:text-sm font-medium text-muted transition-colors hover:bg-nav-surface-hover hover:text-heading"
				>
					<span aria-hidden="true">&larr;</span> Back to site
				</a>

				{#if !isAuthPage}
					<nav class="hidden lg:flex lg:items-center lg:gap-1">
						{#each adminNavItems as item (item.href)}
							{@const isActive = isAdminItemActive(item.href)}
							<a
								href={item.href}
								class="rounded-lg px-2.5 py-1.5 text-xl transition-colors {isActive
									? 'bg-nav-active font-semibold text-heading'
									: 'text-muted hover:bg-nav-surface-hover hover:text-admin-nav-hover'}"
							>
								{item.label}
							</a>
						{/each}
					</nav>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if !isAuthPage}
					<form method="POST" action={resolve('/admin/logout')} class="hidden sm:block">
						<button
							type="submit"
							class="rounded-lg border border-card-border px-3 py-1.5 text-xs sm:text-sm text-muted transition-colors hover:bg-nav-surface-hover hover:text-heading"
						>
							Log out
						</button>
					</form>
				{/if}

				<button
					aria-label={theme === 'light'
						? 'Switch to dark mode'
						: theme === 'dark'
							? 'Switch to hotdog stand mode'
							: 'Switch to light mode'}
					class="inline-flex h-9 items-center text-heading"
					onclick={toggleTheme}
					type="button"
				>
					{#if theme === 'dark'}
						<Fa icon={faMoon} class="h-4 w-4" />
					{:else if theme === 'hotdog'}
						<Fa icon={faHotdog} class="h-4 w-4" />
					{:else}
						<Fa icon={faSun} class="h-4 w-4" />
					{/if}
				</button>

				{#if !isAuthPage}
					<button
						aria-expanded={isMobileMenuOpen}
						aria-label="Toggle admin navigation menu"
						class="inline-flex h-9 w-9 items-center justify-center rounded border border-menu-border text-menu-icon transition-colors hover:bg-menu-hover lg:hidden"
						onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
						type="button"
					>
						{#if isMobileMenuOpen}
							<Fa icon={faBurger} rotate={90} class="h-4 w-4" />
						{:else}
							<Fa icon={faBars} class="h-4 w-4" />
						{/if}
					</button>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-6">
				<a
					aria-label="Home"
					class="text-base font-bold tracking-tight text-heading"
					href={resolve('/')}
					onclick={closeMobileMenu}
				>
					{siteName}
				</a>
				<nav class="hidden md:flex md:items-center md:gap-4">
					{#each navItems as item (item.href)}
						{@const isActive = page.url.pathname === item.href}
						<a
							href={item.href}
							class="text-xl transition-colors {isActive
								? 'font-semibold text-heading underline underline-offset-4 decoration-nav-decoration'
								: 'text-muted hover:text-nav-hover'}"
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>

			<div class="flex items-center gap-2">
				<button
					aria-label={theme === 'light'
						? 'Switch to dark mode'
						: theme === 'dark'
							? 'Switch to hotdog stand mode'
							: 'Switch to light mode'}
					class="inline-flex h-9 items-center text-heading"
					onclick={toggleTheme}
					type="button"
				>
					{#if theme === 'dark'}
						<Fa icon={faMoon} class="h-4 w-4" />
					{:else if theme === 'hotdog'}
						<Fa icon={faHotdog} class="h-4 w-4" />
					{:else}
						<Fa icon={faSun} class="h-4 w-4" />
					{/if}
				</button>

				<button
					aria-expanded={isMobileMenuOpen}
					aria-label="Toggle navigation menu"
					class="inline-flex h-9 w-9 items-center justify-center rounded border border-menu-border text-menu-icon transition-colors hover:bg-menu-hover md:hidden"
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					type="button"
				>
					{#if isMobileMenuOpen}
						<Fa icon={faBurger} rotate={90} class="h-4 w-4" />
					{:else}
						<Fa icon={faBars} class="h-4 w-4" />
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if isMobileMenuOpen}
		{#if isAdmin}
			<nav class="border-t border-chrome-border px-4 py-3 lg:hidden">
				<div class="flex flex-col gap-2">
					<a
						href={resolve('/')}
						onclick={closeMobileMenu}
						class="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-nav-surface-hover hover:text-heading"
					>
						<span aria-hidden="true">&larr;</span> Back to site
					</a>
					{#if !isAuthPage}
						{#each adminNavItems as item (item.href)}
							{@const isActive = isAdminItemActive(item.href)}
							<a
								href={item.href}
								onclick={closeMobileMenu}
								class="rounded-lg px-3 py-2 text-sm transition-colors {isActive
									? 'bg-nav-active font-semibold text-heading'
									: 'text-muted hover:bg-nav-surface-hover hover:text-admin-nav-hover'}"
							>
								{item.label}
							</a>
						{/each}
						<form
							method="POST"
							action={resolve('/admin/logout')}
							class="pt-2 border-t border-card-border"
						>
							<button
								type="submit"
								class="w-full rounded-lg border border-card-border px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-nav-surface-hover hover:text-heading"
							>
								Log out
							</button>
						</form>
					{/if}
				</div>
			</nav>
		{:else}
			<nav class="border-t border-chrome-border px-4 py-3 md:hidden">
				<div class="flex flex-col gap-2">
					{#each navItems as item (item.href)}
						{@const isActive = page.url.pathname === item.href}
						<a
							href={item.href}
							onclick={closeMobileMenu}
							class="rounded px-2 py-1.5 text-sm transition-colors {isActive
								? 'bg-nav-active font-semibold text-heading'
								: 'text-muted hover:bg-nav-surface-hover hover:text-nav-hover'}"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	{/if}
</header>
