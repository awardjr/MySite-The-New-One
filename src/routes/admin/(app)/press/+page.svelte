<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { PressItem } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	let items = $state<PressItem[]>(untrack(() => structuredClone(data.items)));
	let saving = $state(false);

	function addItem() {
		items.push({ title: '', summary: '', href: '' });
	}

	function removeItem(index: number) {
		const item = items[index];
		if (!confirm(`Remove "${item.title || 'this press mention'}"?`)) return;
		items.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Admin - Press</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Press</h1>
<p class="mt-1 text-sm text-muted">
	Add, remove, or edit the press mentions shown on the press page.
</p>

<form
	method="POST"
	class="mt-6 max-w-2xl space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<input type="hidden" name="items" value={JSON.stringify(items)} />

	<div class="space-y-3">
		{#each items as item, i (i)}
			<div class="space-y-2 rounded-lg border border-form-border p-3">
				<input
					bind:value={item.title}
					placeholder="Title"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<textarea
					bind:value={item.summary}
					placeholder="Summary"
					rows="3"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				></textarea>
				<input
					bind:value={item.href}
					placeholder="URL (e.g. https://...)"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>

				<button
					type="button"
					onclick={() => removeItem(i)}
					class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addItem}
		class="rounded-lg border border-dashed border-field-border px-4 py-2 text-sm text-form-muted transition-colors hover:bg-secondary-hover"
	>
		+ Add Press Mention
	</button>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-success">Saved.</p>
	{/if}

	<div>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>
