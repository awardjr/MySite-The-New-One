<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ImageUploadField from '$lib/components/admin/ImageUploadField.svelte';
	import CKEditor from '$lib/components/admin/CKEditor.svelte';
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
	class="mt-2 inline-block text-sm font-medium text-link hover:underline"
	href={resolve('/blog/[slug]', { slug: data.post.slug })}
	rel="noopener noreferrer"
	target="_blank"
>
	Preview →
</a>

<form
	action="?/update"
	class="mt-6 space-y-5"
	method="POST"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="title">Title</label>
		<input
			bind:value={title}
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
			id="title"
			name="title"
			required
		/>
	</div>

	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="date">Date</label>
		<input
			bind:value={date}
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
			id="date"
			name="date"
			required
			type="date"
		/>
	</div>

	<ImageUploadField
		bind:value={image}
		id="image"
		label="Image URL / path"
		name="image"
		placeholder="/blog/my-post.jpg (put the file in static/, or upload below) or a full URL"
	/>

	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="preview">Preview</label>
		<textarea
			bind:value={preview}
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
			id="preview"
			name="preview"
			rows="3"></textarea>
	</div>

	<CKEditor bind:value={content} id="content" label="Content" name="content" />

	<label class="flex items-center gap-2 text-sm text-field-label">
		<input bind:checked={draft} class="rounded border-field-border" name="draft" type="checkbox" />
		Save as draft (hidden from the public blog)
	</label>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<button
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
			disabled={saving}
			type="submit"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
		<a
			class="rounded-lg border border-field-border px-4 py-2 text-sm transition-colors hover:bg-secondary-hover"
			href={resolve('/admin/blog')}
		>
			Cancel
		</a>
	</div>
</form>

<div class="mt-10 rounded-lg border border-danger-border p-4">
	<h2 class="text-sm font-semibold text-danger-heading">Danger zone</h2>
	<p class="mt-1 text-sm text-muted">Permanently delete this post. This cannot be undone.</p>
	<form
		action="?/delete"
		class="mt-3"
		method="POST"
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
			class="rounded-lg border border-danger-button-border px-4 py-2 text-sm text-danger-text transition-colors hover:bg-danger-hover disabled:opacity-60"
			disabled={deleting}
			type="submit"
		>
			{deleting ? 'Deleting…' : 'Delete Post'}
		</button>
	</form>
</div>
