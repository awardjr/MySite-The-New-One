<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import type { PageProps } from './$types';
	import type { PressItem } from '#lib/server/content.js';

	let { data, form }: PageProps = $props();

	let items = $state<PressItem[]>(untrack(() => structuredClone(data.items)));
	let saving = $state(false);
	let showSaved = $derived(!!(form && form.success));

	function clearSaved() {
		showSaved = false;
	}

	function addItem() {
		items.push({ outlet: '', title: '', summary: '', href: '', date: '' });
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
	Edit the headline, subtitle, and press mentions shown on the press page.
</p>

<HeadlineForm
	headline={data.headline}
	subtitle={data.subtitle}
	saved={!!form?.headlineSuccess}
	headlinePlaceholder="Press"
	oninput={clearSaved}
/>

<form
	method="POST"
	action="?/save"
	class="mt-6 space-y-4"
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
					bind:value={item.outlet}
					oninput={clearSaved}
					placeholder="Outlet / Venue (e.g. The New York Times)"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<input
					bind:value={item.title}
					oninput={clearSaved}
					placeholder="Piece title"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<textarea
					bind:value={item.summary}
					oninput={clearSaved}
					placeholder="Description"
					rows="3"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				></textarea>
				<input
					bind:value={item.href}
					oninput={clearSaved}
					placeholder="URL (e.g. https://...)"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<input
					type="date"
					bind:value={item.date}
					onchange={clearSaved}
					placeholder="Date (optional)"
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
	{:else if showSaved}
		<p in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="text-sm text-success">
			Saved.
		</p>
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
