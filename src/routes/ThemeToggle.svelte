<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faHotdog, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

	const themes = {
		light: { next: 'dark', label: 'Switch to dark mode', icon: faSun },
		dark: { next: 'hotdog', label: 'Switch to hotdog stand mode', icon: faMoon },
		hotdog: { next: 'light', label: 'Switch to light mode', icon: faHotdog }
	} as const;

	let theme: keyof typeof themes = $state('light');

	onMount(() => {
		// app.html applies the stored theme before first paint by adding a `dark` or `hotdog`
		// class to <html>; the light theme is the absence of both.
		const classes = document.documentElement.classList;
		theme = classes.contains('hotdog') ? 'hotdog' : classes.contains('dark') ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = themes[theme].next;
		document.documentElement.classList.remove('dark', 'hotdog');
		if (theme !== 'light') {
			document.documentElement.classList.add(theme);
		}
		localStorage.setItem('theme', theme);
	}
</script>

<button
	aria-label={themes[theme].label}
	class="inline-flex h-9 items-center text-heading"
	onclick={toggleTheme}
	type="button"
>
	<Fa icon={themes[theme].icon} class="h-4 w-4" />
</button>
