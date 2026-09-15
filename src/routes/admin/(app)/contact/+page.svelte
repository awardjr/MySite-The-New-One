<script lang="ts">
	import { enhance } from '$app/forms';
	import { iconOptions } from '$lib/icons';
	import type { PageProps } from './$types';
	import type { ContactLink } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	let links = $state<ContactLink[]>(structuredClone(data.links));
	let saving = $state(false);

	function addLink() {
		links.push({ label: '', href: '', icon: 'link' });
	}

	function removeLink(index: number) {
		links.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Admin - Contact</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Contact Links</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Add, remove, or edit the links shown on the contact page.
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
	<input type="hidden" name="links" value={JSON.stringify(links)} />

	<div class="space-y-3">
		{#each links as link, i (i)}
			<div class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center dark:border-gray-800">
				<input
					bind:value={link.label}
					placeholder="Label (e.g. LinkedIn)"
					class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<input
					bind:value={link.href}
					placeholder="URL (e.g. https://... or mailto:you@example.com)"
					class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<select
					bind:value={link.icon}
					class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				>
					{#each iconOptions as iconKey (iconKey)}
						<option value={iconKey}>{iconKey}</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={() => removeLink(i)}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addLink}
		class="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
	>
		+ Add Link
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
