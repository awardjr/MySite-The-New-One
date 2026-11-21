<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		hint,
		children
	}: { id?: string; label?: string | null; hint?: string; children: Snippet } = $props();
</script>

<div class="space-y-1">
	{#if label}
		<label for={id} class="text-sm font-medium text-field-label">{label}</label>
	{/if}
	{@render children()}
	{#if hint}
		<p class="text-xs text-form-hint">{hint}</p>
	{/if}
</div>
