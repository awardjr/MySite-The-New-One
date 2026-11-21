<script lang="ts" generics="T">
	import { tick, untrack, type Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import { acceptCurrentValue, formHasChanges, trackChanges } from '#lib/unsavedChanges.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';

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
		reorderable?: boolean;
		newItem: () => T;
		itemName: (item: T) => string;
		row: Snippet<[item: T, controls: Snippet]>;
	} = $props();

	let items = $state(untrack(() => structuredClone(savedItems)));
	let formElement: HTMLFormElement | undefined = $state();
	let rowsElement: HTMLDivElement | undefined = $state();
	const saveForm = pendingForm({ reset: false });
	let showSaved = $derived(!!form?.success);

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

	<div class="flex flex-wrap items-center gap-3">
		<SubmitButton pending={saveForm.pending} />
		<FormStatus error={form?.error} saved={showSaved && (form?.notice ?? true)} />
	</div>
</form>
