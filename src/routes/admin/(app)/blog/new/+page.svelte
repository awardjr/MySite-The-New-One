<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let slug = $state(untrack(() => form?.slug ?? ''));
	let title = $state(untrack(() => form?.title ?? ''));
	let date = $state(untrack(() => form?.date ?? ''));
	let image = $state(untrack(() => form?.image ?? ''));
	let preview = $state(untrack(() => form?.preview ?? ''));
	let content = $state(untrack(() => form?.content ?? ''));

	let saving = $state(false);
</script>

<svelte:head>
	<title>Admin - New Post</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">New Post</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">Create a new blog post.</p>

<form
	method="POST"
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
		<label for="slug" class="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
		<input
			id="slug"
			name="slug"
			bind:value={slug}
			placeholder="Leave empty to generate from the title"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
		<p class="text-xs text-gray-500 dark:text-gray-400">Used in the post's URL. Lowercase letters, numbers, and hyphens only.</p>
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
			{saving ? 'Creating…' : 'Create Post'}
		</button>
		<a
			href="/admin/blog"
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
		>
			Cancel
		</a>
	</div>
</form>
