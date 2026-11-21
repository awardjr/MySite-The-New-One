<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	/**
	 * A labelled input for the sign-in and settings pages. `name` defaults to `id`, and any other
	 * input attribute is passed through. Children become a hint under the input.
	 */
	let {
		id,
		label,
		large = false,
		class: className,
		children,
		...attributes
	}: HTMLInputAttributes & {
		id: string;
		label: string;
		/** Matches the larger text of the settings page. */
		large?: boolean;
		children?: Snippet;
	} = $props();
</script>

<div class={large ? 'space-y-2' : 'space-y-1'}>
	<label
		for={id}
		class={['font-medium', large ? 'text-base text-field-label' : 'text-sm text-copy']}
	>
		{label}
	</label>
	<input {id} name={id} {...attributes} class={[large ? 'input-lg' : 'input-auth', className]} />
	{#if children}
		<p class="text-xs text-muted">{@render children()}</p>
	{/if}
</div>
