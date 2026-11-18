<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		class: className,
		...attributes
	}: HTMLInputAttributes & { id: string; label: string } = $props();
</script>

<div class="space-y-2">
	<label for={id} class="text-base font-medium text-field-label">{label}</label>
	<input
		{id}
		{...attributes}
		class={[
			'w-full rounded-lg border border-field-border bg-field px-4 py-2.5 text-base text-field-text focus:outline-none',
			className
		]}
	/>
</div>
