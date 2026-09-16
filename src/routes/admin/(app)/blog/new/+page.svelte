<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ImageUploadField from '$lib/components/admin/ImageUploadField.svelte';
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

<h1 class="text-2xl font-bold tracking-tight text-heading">New Post</h1>
<p class="mt-1 text-sm text-muted">Create a new blog post.</p>

<form
	method="POST"
	class="mt-6 max-w-2xl space-y-5"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="title" class="text-sm font-medium text-field-label">Title</label>
		<input
			id="title"
			name="title"
			bind:value={title}
			required
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<label for="slug" class="text-sm font-medium text-field-label">Slug</label>
		<input
			id="slug"
			name="slug"
			bind:value={slug}
			placeholder="Leave empty to generate from the title"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
		<p class="text-xs text-form-hint">
			Used in the post's URL. Lowercase letters, numbers, and hyphens only.
		</p>
	</div>

	<div class="space-y-1">
		<label for="date" class="text-sm font-medium text-field-label">Date</label>
		<input
			id="date"
			name="date"
			type="date"
			bind:value={date}
			required
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<ImageUploadField
			id="image"
			name="image"
			label="Image URL / path"
			placeholder="/blog/my-post.jpg (put the file in static/, or upload below) or a full URL"
			bind:value={image}
		/>
	</div>

	<div class="space-y-1">
		<label for="preview" class="text-sm font-medium text-field-label">Preview</label>
		<textarea
			id="preview"
			name="preview"
			bind:value={preview}
			rows="3"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		></textarea>
	</div>

	<div class="space-y-1">
		<label for="content" class="text-sm font-medium text-field-label">Content</label>
		<textarea
			id="content"
			name="content"
			bind:value={content}
			rows="12"
			class="w-full rounded-lg border border-field-border px-3 py-2 font-mono text-sm bg-field text-field-text"
		></textarea>
	</div>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{saving ? 'Creating…' : 'Create Post'}
		</button>
		<a
			href="/admin/blog"
			class="rounded-lg border border-field-border px-4 py-2 text-sm transition-colors hover:bg-secondary-hover"
		>
			Cancel
		</a>
	</div>
</form>
