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
		{ href: resolve('blog'), label: 'Posts' },
		{ href: resolve('press'), label: 'Press' },
		{ href: resolve('works'), label: 'Works' },
		{ href: resolve('pinball'), label: 'Pinball' },
		{ href: resolve('contact'), label: 'Contact' }
	];

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

	let isAdmin = $derived(
		page.url.pathname === resolve('admin') || page.url.pathname.startsWith(`${resolve('admin')}/`)
	);
	let isAuthPage = $derived(
		page.url.pathname === resolve('admin/login') ||
			page.url.pathname === resolve('admin/setup') ||
			page.url.pathname === resolve('admin/forgot-password') ||
			page.url.pathname === resolve('admin/reset')
	);
	const themeOrder: Theme[] = ['light', 'dark', 'hotdog'];

	let navLinks: HTMLAnchorElement[] = $state([]);
	let hoveredIndex: number | null = $state(null);
	let activeIndex = $derived(navItems.findIndex((item) => item.href === page.url.pathname));
	let underlineIndex = $derived(hoveredIndex ?? activeIndex);
	let underline = $state({ left: 0, width: 0, top: 0, ready: false });
	let activeBar = $state({ left: 0, width: 0, top: 0 });

	function updateUnderline() {
		const activeLink = activeIndex >= 0 ? navLinks[activeIndex] : undefined;
		if (activeLink) {
			activeBar.left = activeLink.offsetLeft;
			activeBar.width = activeLink.offsetWidth;
			activeBar.top = activeLink.offsetTop + activeLink.offsetHeight - 2;
		} else {
			activeBar.width = 0;
		}
		const link = underlineIndex >= 0 ? navLinks[underlineIndex] : undefined;
		if (!link) {
			underline.width = 0;
			return;
		}
		underline.left = link.offsetLeft;
		underline.width = link.offsetWidth;
		underline.top = link.offsetTop + link.offsetHeight - 2;
		underline.ready = true;
	}

	$effect(() => {
		void underlineIndex;
		void isAdmin;
		updateUnderline();
	});

	function isAdminItemActive(href: string): boolean {
		return href === resolve('admin')
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

<svelte:window onresize={updateUnderline} />

<header
	class="sticky top-0 z-50 w-full border-b border-chrome-border bg-header"
>
	<div class="mx-auto flex h-16 max-w-7/10 items-center justify-between px-4">
		{#if isAdmin}
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
				<nav
					class="relative hidden md:flex md:items-center md:gap-4"
					onmouseleave={() => (hoveredIndex = null)}
				>
					{#each navItems as item, i (item.href)}
						{@const isActive = page.url.pathname === item.href}
						<a
							bind:this={navLinks[i]}
							href={item.href}
							onmouseenter={() => (hoveredIndex = i)}
							onfocus={() => (hoveredIndex = i)}
							onblur={() => (hoveredIndex = null)}
							class="pb-1 text-xl transition-colors {isActive
								? 'font-semibold text-heading'
								: 'text-nav-text hover:text-nav-hover'}"
						>
							{item.label}
						</a>
					{/each}
					<span
						aria-hidden="true"
						class="pointer-events-none absolute left-0 h-0.5 rounded bg-[var(--theme-nav-decoration-dim,color-mix(in_oklab,var(--color-nav-decoration),black_45%))] transition-opacity duration-300 motion-reduce:transition-none"
						style:width="{activeBar.width}px"
						style:top="{activeBar.top}px"
						style:transform="translateX({activeBar.left}px)"
						style:opacity={hoveredIndex !== null && hoveredIndex !== activeIndex && activeBar.width
							? 1
							: 0}
					></span>
					<span
						aria-hidden="true"
						class="pointer-events-none absolute left-0 h-0.5 rounded bg-nav-decoration motion-reduce:transition-none {underline.ready
							? 'transition-[transform,width,opacity] duration-300 ease-out'
							: ''}"
						style:width="{underline.width}px"
						style:top="{underline.top}px"
						style:transform="translateX({underline.left}px)"
						style:opacity={underline.width ? 1 : 0}
					></span>
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
								: 'text-nav-text hover:bg-nav-surface-hover hover:text-nav-hover'}"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	{/if}
</header>
