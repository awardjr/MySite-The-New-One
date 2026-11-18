<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import CKEditor from '#lib/components/admin/CKEditor.svelte';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import type { PostFields } from '#lib/server/content.js';

	/** The editor shared by the "new post" and "edit post" pages. */
	let {
		post,
		form,
		action,
		showSlug = false,
		submitLabel,
		pendingLabel
	}: {
		post: PostFields;
		/** The last submission; what was typed takes priority over `post`. */
		form?: (Partial<PostFields> & { slug?: string; error?: string }) | null;
		action?: string;
		showSlug?: boolean;
		submitLabel?: string;
		pendingLabel?: string;
	} = $props();

	let fields = $state(untrack(() => ({ slug: '', ...post, ...form })));
	const saveForm = pendingForm({ reset: false });
</script>

<form {action} class="mt-6 space-y-5" method="POST" use:enhance={saveForm.submit}>
	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="title">Title</label>
		<input bind:value={fields.title} class="input" id="title" name="title" required />
	</div>

	{#if showSlug}
		<div class="space-y-1">
			<label class="text-sm font-medium text-field-label" for="slug">Slug</label>
			<input
				bind:value={fields.slug}
				class="input"
				id="slug"
				name="slug"
				placeholder="Leave empty to generate from the title"
			/>
			<p class="text-xs text-form-hint">
				Used in the post's URL. Lowercase letters, numbers, and hyphens only.
			</p>
		</div>
	{/if}

	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="date">Date</label>
		<input bind:value={fields.date} class="input-date" id="date" name="date" required type="date" />
	</div>

	<ImageUploadField
		bind:value={fields.image}
		id="image"
		label="Image URL / path"
		name="image"
		placeholder="/blog/my-post.jpg (put the file in static/, or upload below) or a full URL"
	/>

	<div class="space-y-1">
		<label class="text-sm font-medium text-field-label" for="preview">Preview</label>
		<textarea bind:value={fields.preview} class="input" id="preview" name="preview" rows="3"
		></textarea>
	</div>

	<CKEditor bind:value={fields.content} id="content" label="Content" name="content" />

	<label class="flex items-center gap-2 text-sm text-field-label">
		<input
			bind:checked={fields.draft}
			class="rounded border-field-border"
			name="draft"
			type="checkbox"
		/>
		Save as draft (hidden from the public blog)
	</label>

	<FormStatus error={form?.error} />

	<div class="flex items-center gap-3">
		<SubmitButton pending={saveForm.pending} label={submitLabel} {pendingLabel} />
		<a class="btn-secondary" href={resolve('admin/blog')}>Cancel</a>
	</div>
</form>
