<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import { trackChanges } from '#lib/unsavedChanges.js';
	import CKEditor from '#lib/components/admin/CKEditor.svelte';
	import FormRow from '#lib/components/admin/FormRow.svelte';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import type { PostFields } from '#lib/server/content.js';

	let {
		post,
		form,
		action,
		showSlug = false,
		submitLabel,
		pendingLabel
	}: {
		post: PostFields;
		form?: (Partial<PostFields> & { slug?: string; error?: string }) | null;
		action?: string;
		showSlug?: boolean;
		submitLabel?: string;
		pendingLabel?: string;
	} = $props();

	let fields = $state(untrack(() => ({ slug: '', ...post, ...form })));
	const saveForm = pendingForm({ reset: false });
</script>

<form {action} class="mt-6 space-y-5" method="POST" use:enhance={saveForm.submit} use:trackChanges>
	<FormRow id="title" label="Title">
		<input bind:value={fields.title} class="input" id="title" name="title" required />
	</FormRow>

	{#if showSlug}
		<FormRow
			id="slug"
			label="Slug"
			hint="Used in the post's URL. Lowercase letters, numbers, and hyphens only."
		>
			<input
				bind:value={fields.slug}
				class="input"
				id="slug"
				name="slug"
				placeholder="Leave empty to generate from the title"
			/>
		</FormRow>
	{/if}

	<FormRow id="date" label="Date">
		<input bind:value={fields.date} class="input-date" id="date" name="date" required type="date" />
	</FormRow>

	<ImageUploadField
		bind:value={fields.image}
		id="image"
		label="Image URL / path"
		name="image"
		placeholder="/blog/my-post.jpg (put the file in static/, or upload below) or a full URL"
	/>

	<FormRow id="preview" label="Preview">
		<textarea bind:value={fields.preview} class="input" id="preview" name="preview" rows="3"
		></textarea>
	</FormRow>

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

	<div class="flex flex-wrap items-center gap-3">
		<SubmitButton pending={saveForm.pending} label={submitLabel} {pendingLabel} />
		<a class="btn-secondary" href={resolve('admin/blog')}>Cancel</a>
		<FormStatus error={form?.error} />
	</div>
</form>
