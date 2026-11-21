<script lang="ts">
	import { fade } from 'svelte/transition';

	let {
		error,
		saved,
		large,
		class: className
	}: {
		error?: string;
		saved?: boolean | string;
		large?: boolean;
		class?: string;
	} = $props();

	let size = $derived(large ? 'text-base font-medium' : 'text-sm');
</script>

{#if error}
	<p class={[size, 'text-error', className]}>{error}</p>
{:else if saved}
	<p
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
		class={[size, 'text-success', className]}
	>
		{saved === true ? 'Saved.' : saved}
	</p>
{/if}
