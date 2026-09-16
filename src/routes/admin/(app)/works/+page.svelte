<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageUploadField from '$lib/components/admin/ImageUploadField.svelte';
	import type { PageProps } from './$types';
	import type { WorkItem } from '$lib/server/content';

	// Keep in sync with the platform keys used in src/routes/works/+page.svelte's `platformIcons` map.
	const platformOptions: { key: string; label: string }[] = [
		{ key: 'web', label: 'Web' },
		{ key: 'windows', label: 'Windows' },
		{ key: 'macos', label: 'macOS' },
		{ key: 'linux', label: 'Linux' },
		{ key: 'ios', label: 'iOS' },
		{ key: 'android', label: 'Android' },
		{ key: 'switch', label: 'Nintendo Switch' }
	];

	let { data, form }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let items = $state<WorkItem[]>(structuredClone(data.items));
	let saving = $state(false);

	function addItem() {
		items.push({ title: '', description: '', image: '', platforms: [] });
	}

	function removeItem(index: number) {
		const item = items[index];
		if (!confirm(`Remove "${item.title || 'this work'}"?`)) return;
		items.splice(index, 1);
	}

	function togglePlatform(item: WorkItem, key: string, checked: boolean) {
		if (checked) {
			if (!item.platforms.includes(key)) {
				item.platforms.push(key);
			}
		} else {
			const idx = item.platforms.indexOf(key);
			if (idx !== -1) {
				item.platforms.splice(idx, 1);
			}
		}
	}
</script>

<svelte:head>
	<title>Admin - Works</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Works</h1>
<p class="mt-1 text-sm text-muted">Add, remove, or edit the works shown on the works page.</p>

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
					bind:value={item.description}
					placeholder="Description"
					rows="3"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				></textarea>
				<ImageUploadField label={null} placeholder="Image URL / path" bind:value={item.image} />

				<div class="flex flex-wrap gap-3 pt-1">
					{#each platformOptions as platform (platform.key)}
						<label class="flex items-center gap-1.5 text-sm text-field-label">
							<input
								type="checkbox"
								checked={item.platforms.includes(platform.key)}
								onchange={(e) => togglePlatform(item, platform.key, e.currentTarget.checked)}
								class="rounded border-field-border"
							/>
							{platform.label}
						</label>
					{/each}
				</div>

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
		+ Add Work
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
