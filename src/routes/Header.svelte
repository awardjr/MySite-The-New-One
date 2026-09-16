<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faSun, faMoon, faBars, faBurger, faHotdog } from '@fortawesome/free-solid-svg-icons';

	type Theme = 'light' | 'dark' | 'hotdog';

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

	const themeOrder: Theme[] = ['light', 'dark', 'hotdog'];

	onMount(() => {
		if (document.documentElement.classList.contains('hotdog')) {
			theme = 'hotdog';
		} else if (document.documentElement.classList.contains('dark')) {
			theme = 'dark';
		} else {
			theme = 'light';
		}
	});

	function toggleTheme() {
		const nextIndex = (themeOrder.indexOf(theme) + 1) % themeOrder.length;
		theme = themeOrder[nextIndex];
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

<header class="sticky top-0 z-50 w-full border-b border-chrome-border bg-header backdrop-blur">
	<div class="mx-auto flex h-16 max-w-7/10 items-center justify-between px-4">
		<div class="flex items-center gap-6">
			<a
				href={resolve('/')}
				aria-label="Home"
				class="text-base font-bold tracking-tight text-heading"
				onclick={closeMobileMenu}
			>
			</a>
			<nav class="hidden md:flex md:items-center md:gap-4">
				{#each navItems as item (item.href)}
					{@const isActive = page.url.pathname === item.href}
					<a
						href={item.href}
						class="text-lg transition-colors {isActive
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
				type="button"
				onclick={toggleTheme}
				aria-label={theme === 'light'
					? 'Switch to dark mode'
					: theme === 'dark'
						? 'Switch to hotdog stand mode'
						: 'Switch to light mode'}
				class="inline-flex h-9 items-center text-heading"
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
				type="button"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-label="Toggle navigation menu"
				aria-expanded={isMobileMenuOpen}
				class="inline-flex h-9 w-9 items-center justify-center rounded border border-menu-border text-menu-icon transition-colors hover:bg-menu-hover md:hidden"
			>
				{#if isMobileMenuOpen}
					<Fa icon={faBurger} rotate={90} class="h-4 w-4" />
				{:else}
					<Fa icon={faBars} class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</div>

	{#if isMobileMenuOpen}
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
</header>
