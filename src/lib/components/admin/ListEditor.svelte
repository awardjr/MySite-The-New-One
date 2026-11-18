<script lang="ts" generics="T">
	import { untrack, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';

	/**
	 * The page headline and list form shared by the admin list pages. It posts every row as JSON
	 * to the page's `save` action (see `saveListAction` in #lib/server/listAction.ts).
	 */
	let {
		field,
		items: savedItems,
		headline,
		subtitle,
		headlinePlaceholder,
		form,
		addLabel,
		newItem,
		itemName,
		row
	}: {
		/** The form field the rows are posted in. */
		field: string;
		items: T[];
		headline: string;
		subtitle: string;
		headlinePlaceholder: string;
		form?: { error?: string; success?: boolean; headlineSuccess?: boolean } | null;
		addLabel: string;
		newItem: () => T;
		/** How the remove confirmation refers to an item. */
		itemName: (item: T) => string;
		/** Renders one row; call the second argument to remove it. */
		row: Snippet<[item: T, remove: () => void]>;
	} = $props();

	let items = $state(untrack(() => structuredClone(savedItems)));
	const saveForm = pendingForm({ reset: false });
	// Follows the last save, but hides again as soon as anything is edited.
	let showSaved = $derived(!!form?.success);

	function clearSaved() {
		showSaved = false;
	}

	function remove(index: number) {
		if (!confirm(`Remove "${itemName(items[index])}"?`)) return;
		items.splice(index, 1);
	}
</script>

<HeadlineForm
	{headline}
	{subtitle}
	saved={!!form?.headlineSuccess}
	{headlinePlaceholder}
	oninput={clearSaved}
/>

<form
	method="POST"
	action="?/save"
	class="mt-6 space-y-4"
	use:enhance={saveForm.submit}
	oninput={clearSaved}
	onchange={clearSaved}
>
	<input type="hidden" name={field} value={JSON.stringify(items)} />

	<div class="space-y-3">
		{#each items as item, i (i)}
			{@render row(item, () => remove(i))}
		{/each}
	</div>

	<button type="button" onclick={() => items.push(newItem())} class="btn-add">{addLabel}</button>

	<FormStatus error={form?.error} saved={showSaved} />

	<div>
		<SubmitButton pending={saveForm.pending} />
	</div>
</form>
