<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { WorkItem } from '$lib/server/content';

	// Keep in sync with the platform keys used in src/routes/works/+page.svelte's `platformIcons` map.
	const platformOptions: { key: string; label: string }[] = [
		{ key: 'web', label: 'Web' },
		{ key: 'windows', label: 'Windows' },
		{ key: 'macos', label: 'macOS' },
		{ key: 'linux', label: 'Linux' },
		{ key: 'playstation', label: 'PlayStation' },
		{ key: 'xbox', label: 'Xbox' },
		{ key: 'switch', label: 'Nintendo Switch' }
	];

	let { data, form }: PageProps = $props();

	let items = $state<WorkItem[]>(structuredClone(data.items));
	let saving = $state(false);

	function addItem() {
		items.push({ title: '', description: '', image: '', platforms: [] });
	}

	function removeItem(index: number) {
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

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Works</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Add, remove, or edit the works shown on the works page.
</p>

<form
	method="POST"
	class="mt-6 max-w-2xl space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<input type="hidden" name="items" value={JSON.stringify(items)} />

	<div class="space-y-3">
		{#each items as item, i (i)}
			<div class="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
				<input
					bind:value={item.title}
					placeholder="Title"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<textarea
					bind:value={item.description}
					placeholder="Description"
					rows="3"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				></textarea>
				<input
					bind:value={item.image}
					placeholder="Image URL / path"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>

				<div class="flex flex-wrap gap-3 pt-1">
					{#each platformOptions as platform (platform.key)}
						<label class="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
							<input
								type="checkbox"
								checked={item.platforms.includes(platform.key)}
								onchange={(e) => togglePlatform(item, platform.key, e.currentTarget.checked)}
								class="rounded border-gray-300 dark:border-gray-700"
							/>
							{platform.label}
						</label>
					{/each}
				</div>

				<button
					type="button"
					onclick={() => removeItem(i)}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addItem}
		class="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
	>
		+ Add Work
	</button>

	{#if form?.error}
		<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-green-600 dark:text-green-400">Saved.</p>
	{/if}

	<div>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>
