<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import MenuButton from './MenuButton.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import type { LayoutData } from './$types';

	type Sections = LayoutData['sections'];

	let {
		siteName,
		sections,
		menuOpen = $bindable()
	}: { siteName: string; sections: Sections; menuOpen: boolean } = $props();

	// Items naming a section are only shown while that section has content.
	const allNavItems: { href: string; label: string; section?: keyof Sections }[] = [
		{ href: resolve('/'), label: 'Home' },
		{ href: resolve('blog'), label: 'Posts', section: 'blog' },
		{ href: resolve('press'), label: 'Press', section: 'press' },
		{ href: resolve('works'), label: 'Works', section: 'works' },
		{ href: resolve('pinball'), label: 'Pinball', section: 'pinball' },
		{ href: resolve('contact'), label: 'Contact', section: 'contact' }
	];
	let navItems = $derived(allNavItems.filter((item) => !item.section || sections[item.section]));

	let navLinks: HTMLAnchorElement[] = $state([]);
	let hoveredIndex: number | null = $state(null);
	let activeIndex = $derived(navItems.findIndex((item) => item.href === page.url.pathname));
	let underlineIndex = $derived(hoveredIndex ?? activeIndex);
	let underline = $state({ left: 0, width: 0, top: 0 });
	let underlineReady = $state(false);
	let activeBar = $state({ left: 0, width: 0, top: 0 });

	/** Moves a bar under a link, or hides it when there is no link. Returns whether it is shown. */
	function placeBar(bar: typeof underline, link: HTMLAnchorElement | undefined): boolean {
		if (!link) {
			bar.width = 0;
			return false;
		}
		bar.left = link.offsetLeft;
		bar.width = link.offsetWidth;
		bar.top = link.offsetTop + link.offsetHeight - 2;
		return true;
	}

	function updateBars() {
		placeBar(activeBar, navLinks[activeIndex]);
		if (placeBar(underline, navLinks[underlineIndex])) underlineReady = true;
	}

	$effect(() => {
		void navItems;
		updateBars();
	});

	function closeMobileMenu() {
		menuOpen = false;
	}
</script>

<svelte:window onresize={updateBars} />

<div class="mx-auto flex h-16 max-w-7/10 max-lg:max-w-none items-center justify-between px-4">
	<!-- Burger menu - left on mobile, hidden on desktop -->
	<div class="flex md:hidden">
		<MenuButton label="Toggle navigation menu" bind:open={menuOpen} />
	</div>

	<!-- Site name - centered on mobile -->
	<div class="flex items-center gap-6 md:gap-6">
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
				class="pointer-events-none absolute left-0 h-0.5 rounded bg-(--theme-nav-decoration-dim,color-mix(in_oklab,var(--color-nav-decoration),black_45%)) transition-opacity duration-300 motion-reduce:transition-none"
				style:width="{activeBar.width}px"
				style:top="{activeBar.top}px"
				style:transform="translateX({activeBar.left}px)"
				style:opacity={hoveredIndex !== null && hoveredIndex !== activeIndex && activeBar.width
					? 1
					: 0}
			></span>
			<span
				aria-hidden="true"
				class="pointer-events-none absolute left-0 h-0.5 rounded bg-nav-decoration motion-reduce:transition-none {underlineReady
					? 'transition-[transform,width,opacity] duration-300 ease-out'
					: ''}"
				style:width="{underline.width}px"
				style:top="{underline.top}px"
				style:transform="translateX({underline.left}px)"
				style:opacity={underline.width ? 1 : 0}
			></span>
		</nav>
	</div>

	<!-- Theme toggle - right on mobile -->
	<div class="flex items-center gap-2">
		<ThemeToggle />
	</div>
</div>

{#if menuOpen}
	<nav
		transition:slide|global={{ duration: 150 }}
		class="border-t border-chrome-border px-4 py-3 md:hidden"
	>
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
