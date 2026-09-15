<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let name = $state(data.home.name);
	let tagline = $state(data.home.tagline);
	let photoSrc = $state(data.home.photoSrc);
	let introParagraphs = $state(data.home.introParagraphs.join('\n\n'));

	let saving = $state(false);
</script>

<svelte:head>
	<title>Admin - Home</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Home Page</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Edit the photo, name, tagline, and intro text shown on the homepage.
</p>

<form
	method="POST"
	class="mt-6 max-w-xl space-y-5"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="name" class="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
		<input
			id="name"
			name="name"
			bind:value={name}
			required
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="tagline" class="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
		<input
			id="tagline"
			name="tagline"
			bind:value={tagline}
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="photoSrc" class="text-sm font-medium text-gray-700 dark:text-gray-300">Photo URL / path</label>
		<input
			id="photoSrc"
			name="photoSrc"
			bind:value={photoSrc}
			placeholder="/profile.jpg (put the file in static/) or a full URL"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
		<p class="text-xs text-gray-500 dark:text-gray-400">Leave empty to show the initials placeholder instead.</p>
	</div>

	<div class="space-y-1">
		<label for="introParagraphs" class="text-sm font-medium text-gray-700 dark:text-gray-300">
			Intro text (separate paragraphs with a blank line)
		</label>
		<textarea
			id="introParagraphs"
			name="introParagraphs"
			bind:value={introParagraphs}
			rows="8"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		></textarea>
	</div>

	{#if form?.error}
		<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-green-600 dark:text-green-400">Saved.</p>
	{/if}

	<button
		type="submit"
		disabled={saving}
		class="rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
	>
		{saving ? 'Saving…' : 'Save changes'}
	</button>
</form>
