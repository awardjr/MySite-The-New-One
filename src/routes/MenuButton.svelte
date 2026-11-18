<script lang="ts">
	import Fa from 'svelte-fa';
	import { faBars, faBurger } from '@fortawesome/free-solid-svg-icons';

	let { label, open = $bindable() }: { label: string; open: boolean } = $props();
</script>

<button
	aria-expanded={open}
	aria-label={label}
	class="inline-flex h-9 w-9 items-center justify-center rounded border border-menu-border text-menu-icon transition-colors hover:bg-menu-hover"
	onclick={() => (open = !open)}
	type="button"
>
	{#if open}
		<Fa icon={faBurger} rotate={90} class="h-4 w-4" />
	{:else}
		<Fa icon={faBars} class="h-4 w-4" />
	{/if}
</button>
