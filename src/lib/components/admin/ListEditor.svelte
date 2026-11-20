<script lang="ts" generics="T">
	import { tick, untrack, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import { acceptCurrentValue, formHasChanges, trackChanges } from '#lib/unsavedChanges.js';
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
		removeLabel = 'Remove',
		reorderable = true,
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
		form?: {
			error?: string;
			success?: boolean;
			notice?: string;
			headlineSuccess?: boolean;
		} | null;
		addLabel: string;
		removeLabel?: string;
		/** Turn off for lists the public page sorts by itself. */
		reorderable?: boolean;
		newItem: () => T;
		/** How the remove confirmation and move buttons refer to an item. */
		itemName: (item: T) => string;
		/** Renders one row; the second argument renders its move and remove buttons. */
		row: Snippet<[item: T, controls: Snippet]>;
	} = $props();

	let items = $state(untrack(() => structuredClone(savedItems)));
	let formElement: HTMLFormElement | undefined = $state();
	let rowsElement: HTMLDivElement | undefined = $state();
	const saveForm = pendingForm({ reset: false });
	// Follows the last save, but hides again as soon as anything is edited.
	let showSaved = $derived(!!form?.success);

	// After a save, show what was actually stored: skipped rows disappear and new rows get their
	// ids. Anything edited while the save was running is left alone.
	$effect(() => {
		const element = formElement;
		if (!form?.success || !element) return;
		untrack(() => {
			if (formHasChanges(element)) return;
			items = structuredClone(savedItems);
			void tick().then(() => acceptCurrentValue(element, field));
		});
	});

	function clearSaved() {
		showSaved = false;
	}

	function add() {
		items.push(newItem());
		clearSaved();
	}

	function remove(index: number) {
		if (!confirm(`Remove "${itemName(items[index])}"?`)) return;
		items.splice(index, 1);
		clearSaved();
	}

	async function move(index: number, direction: 'up' | 'down') {
		const target = direction === 'up' ? index - 1 : index + 1;
		[items[index], items[target]] = [items[target], items[index]];
		clearSaved();

		// Keep keyboard focus with the moved row, so it can be moved again.
		await tick();
		const movedRow = rowsElement?.children[target];
		const button =
			movedRow?.querySelector<HTMLButtonElement>(`[data-move="${direction}"]:not(:disabled)`) ??
			movedRow?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)');
		button?.focus();
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
	bind:this={formElement}
	method="POST"
	action="?/save"
	class="mt-6 space-y-4"
	use:enhance={saveForm.submit}
	use:trackChanges
	oninput={clearSaved}
	onchange={clearSaved}
>
	<input type="hidden" name={field} value={JSON.stringify(items)} />

	<div bind:this={rowsElement} class="space-y-3">
		{#each items as item, i (i)}
			{#snippet controls()}
				<div class="flex flex-wrap items-center gap-2">
					{#if reorderable}
						<button
							type="button"
							data-move="up"
							disabled={i === 0}
							aria-label={`Move "${itemName(item)}" up`}
							onclick={() => move(i, 'up')}
							class="btn-secondary px-3 py-1.5 disabled:opacity-60"
						>
							<span aria-hidden="true">↑</span>
						</button>
						<button
							type="button"
							data-move="down"
							disabled={i === items.length - 1}
							aria-label={`Move "${itemName(item)}" down`}
							onclick={() => move(i, 'down')}
							class="btn-secondary px-3 py-1.5 disabled:opacity-60"
						>
							<span aria-hidden="true">↓</span>
						</button>
					{/if}
					<button type="button" onclick={() => remove(i)} class="btn-remove">{removeLabel}</button>
				</div>
			{/snippet}
			{@render row(item, controls)}
		{/each}
	</div>

	<button type="button" onclick={add} class="btn-add">{addLabel}</button>

	<FormStatus error={form?.error} saved={showSaved && (form?.notice ?? true)} />

	<div>
		<SubmitButton pending={saveForm.pending} />
	</div>
</form>
