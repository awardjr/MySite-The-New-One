<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Fa from 'svelte-fa';
	import { faSun, faMoon, faBars, faBurger } from '@fortawesome/free-solid-svg-icons';

	let isDark = $state(false);
	let isMobileMenuOpen = $state(false);

	const navItems = [
		{ href: resolve('/'), label: 'Home' },
		{ href: resolve('/press'), label: 'Press' },
		{ href: resolve('/works'), label: 'Works' },
		{ href: resolve('/skills'), label: 'Skills' },
		{ href: resolve('/blog'), label: 'Blog' },
		{ href: resolve('/pinball'), label: 'Pinball' },
		{ href: resolve('/contact'), label: 'Contact' }
	];

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95"
>
	<div class="mx-auto flex h-16 max-w-7/10 items-center justify-between px-4">
		<div class="flex items-center gap-6">
			<a
				href={resolve('/')}
				class="text-base font-bold tracking-tight text-gray-950 dark:text-gray-50"
				onclick={closeMobileMenu}
			>
			</a>
			<nav class="hidden md:flex md:items-center md:gap-4">
				{#each navItems as item (item.href)}
					{@const isActive = page.url.pathname === item.href}
					<a
						href={item.href}
						class="text-lg transition-colors {isActive
							? 'font-semibold text-gray-950 underline underline-offset-4 decoration-gray-400 dark:text-gray-50 dark:decoration-gray-600'
							: 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100'}"
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
				aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				class="inline-flex h-9 items-center"
			>
				{#if isDark}
					<Fa icon={faMoon} class="h-4 w-4" />
				{:else}
					<Fa icon={faSun} class="h-4 w-4" />
				{/if}
			</button>

			<button
				type="button"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-label="Toggle navigation menu"
				aria-expanded={isMobileMenuOpen}
				class="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 text-gray-800 transition-colors hover:bg-gray-100 md:hidden dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
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
		<nav class="border-t border-gray-200 px-4 py-3 md:hidden dark:border-gray-800">
			<div class="flex flex-col gap-2">
				{#each navItems as item (item.href)}
					{@const isActive = page.url.pathname === item.href}
					<a
						href={item.href}
						onclick={closeMobileMenu}
						class="rounded px-2 py-1.5 text-sm transition-colors {isActive
							? 'bg-gray-100 font-semibold text-gray-950 dark:bg-gray-900 dark:text-gray-50'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'}"
					>
						{item.label}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
