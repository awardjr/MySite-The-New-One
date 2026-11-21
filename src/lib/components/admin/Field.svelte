<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

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
