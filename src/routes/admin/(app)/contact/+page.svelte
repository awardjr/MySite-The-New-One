<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { iconOptions } from '$lib/icons';
	import type { PageProps } from './$types';
	import type { ContactLink } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	let links = $state<ContactLink[]>(untrack(() => structuredClone(data.links)));
	let saving = $state(false);

	function addLink() {
		links.push({ label: '', href: '', icon: 'link' });
	}

	function removeLink(index: number) {
		const link = links[index];
		if (!confirm(`Remove "${link.label || 'this link'}"?`)) return;
		links.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Admin - Contact</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Contact Links</h1>
<p class="mt-1 text-sm text-muted">Add, remove, or edit the links shown on the contact page.</p>

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
	<input type="hidden" name="links" value={JSON.stringify(links)} />

	<div class="space-y-3">
		{#each links as link, i (i)}
			<div
				class="grid grid-cols-1 gap-2 rounded-lg border border-form-border p-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center"
			>
				<input
					bind:value={link.label}
					placeholder="Label (e.g. LinkedIn)"
					class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<input
					bind:value={link.href}
					placeholder="URL (e.g. https://... or mailto:you@example.com)"
					class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<select
					bind:value={link.icon}
					class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				>
					{#each iconOptions as iconKey (iconKey)}
						<option value={iconKey}>{iconKey}</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={() => removeLink(i)}
					class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addLink}
		class="rounded-lg border border-dashed border-field-border px-4 py-2 text-sm text-form-muted transition-colors hover:bg-secondary-hover"
	>
		+ Add Link
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
