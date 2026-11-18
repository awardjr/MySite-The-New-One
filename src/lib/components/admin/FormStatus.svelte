<script lang="ts">
	import { fade } from 'svelte/transition';

	/** The result line of an admin form: an error, or a brief confirmation. */
	let {
		error,
		saved,
		large,
		class: className
	}: {
		error?: string;
		/** Shows a confirmation: "Saved." when true, or this text. */
		saved?: boolean | string;
		/** Matches the larger text of the settings page. */
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
