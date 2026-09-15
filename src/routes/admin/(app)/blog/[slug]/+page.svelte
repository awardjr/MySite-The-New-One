<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let title = $state(untrack(() => form?.title ?? data.post.title));
	let date = $state(untrack(() => form?.date ?? data.post.date));
	let image = $state(untrack(() => form?.image ?? data.post.image));
	let preview = $state(untrack(() => form?.preview ?? data.post.preview));
	let content = $state(untrack(() => form?.content ?? data.post.content));

	let saving = $state(false);
	let deleting = $state(false);
</script>

<svelte:head>
	<title>Admin - Edit Post</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Edit Post</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">/{data.post.slug}</p>

<form
	method="POST"
	action="?/update"
	class="mt-6 max-w-2xl space-y-5"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="title" class="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
		<input
			id="title"
			name="title"
			bind:value={title}
			required
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="date" class="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
		<input
			id="date"
			name="date"
			type="date"
			bind:value={date}
			required
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="image" class="text-sm font-medium text-gray-700 dark:text-gray-300">Image URL / path</label>
		<input
			id="image"
			name="image"
			bind:value={image}
			placeholder="/blog/my-post.jpg (put the file in static/) or a full URL"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="preview" class="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</label>
		<textarea
			id="preview"
			name="preview"
			bind:value={preview}
			rows="3"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		></textarea>
	</div>

	<div class="space-y-1">
		<label for="content" class="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
		<textarea
			id="content"
			name="content"
			bind:value={content}
			rows="12"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		></textarea>
	</div>

	{#if form?.error}
		<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
		<a
			href="/admin/blog"
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
		>
			Cancel
		</a>
	</div>
</form>

<div class="mt-10 max-w-2xl rounded-lg border border-red-200 p-4 dark:border-red-900">
	<h2 class="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
	<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
		Permanently delete this post. This cannot be undone.
	</p>
	<form
		method="POST"
		action="?/delete"
		class="mt-3"
		onsubmit={(event) => {
			if (!confirm(`Delete "${data.post.title}"? This cannot be undone.`)) {
				event.preventDefault();
			}
		}}
		use:enhance={() => {
			deleting = true;
			return async ({ update }) => {
				await update();
				deleting = false;
			};
		}}
	>
		<button
			type="submit"
			disabled={deleting}
			class="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950"
		>
			{deleting ? 'Deleting…' : 'Delete Post'}
		</button>
	</form>
</div>
