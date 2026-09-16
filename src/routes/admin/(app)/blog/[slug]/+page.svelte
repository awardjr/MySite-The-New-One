<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ImageUploadField from '$lib/components/admin/ImageUploadField.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();

	let title = $state(untrack(() => form?.title ?? data.post.title));
	let date = $state(untrack(() => form?.date ?? data.post.date));
	let image = $state(untrack(() => form?.image ?? data.post.image));
	let preview = $state(untrack(() => form?.preview ?? data.post.preview));
	let content = $state(untrack(() => form?.content ?? data.post.content));
	let draft = $state(untrack(() => form?.draft ?? data.post.draft ?? false));

	let saving = $state(false);
	let deleting = $state(false);
</script>

<svelte:head>
	<title>Admin - Edit Post</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Edit Post</h1>
<p class="mt-1 text-sm text-muted">/{data.post.slug}</p>
<a
	href={resolve('/blog/[slug]', { slug: data.post.slug })}
	target="_blank"
	rel="noopener noreferrer"
	class="mt-2 inline-block text-sm font-medium text-link hover:underline"
>
	Preview →
</a>

<form
	method="POST"
	action="?/update"
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

	<RichTextEditor id="content" name="content" label="Content" bind:value={content} />

	<label class="flex items-center gap-2 text-sm text-field-label">
		<input type="checkbox" name="draft" bind:checked={draft} class="rounded border-field-border" />
		Save as draft (hidden from the public blog)
	</label>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
		<a
			href={resolve('/admin/blog')}
			class="rounded-lg border border-field-border px-4 py-2 text-sm transition-colors hover:bg-secondary-hover"
		>
			Cancel
		</a>
	</div>
</form>

<div class="mt-10 max-w-2xl rounded-lg border border-danger-border p-4">
	<h2 class="text-sm font-semibold text-danger-heading">Danger zone</h2>
	<p class="mt-1 text-sm text-muted">Permanently delete this post. This cannot be undone.</p>
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
			class="rounded-lg border border-danger-button-border px-4 py-2 text-sm text-danger-text transition-colors hover:bg-danger-hover disabled:opacity-60"
		>
			{deleting ? 'Deleting…' : 'Delete Post'}
		</button>
	</form>
</div>
