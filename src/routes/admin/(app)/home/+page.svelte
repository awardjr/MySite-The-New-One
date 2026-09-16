<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageUploadField from '$lib/components/admin/ImageUploadField.svelte';
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

<h1 class="text-2xl font-bold tracking-tight text-heading">Home Page</h1>
<p class="mt-1 text-sm text-muted">
	Edit the photo, name, tagline, and intro text shown on the homepage.
</p>

<form
	method="POST"
	class="mt-6 max-w-xl space-y-5"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="name" class="text-sm font-medium text-field-label">Name</label>
		<input
			id="name"
			name="name"
			bind:value={name}
			required
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<label for="tagline" class="text-sm font-medium text-field-label">Tagline</label>
		<input
			id="tagline"
			name="tagline"
			bind:value={tagline}
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<ImageUploadField
			id="photoSrc"
			name="photoSrc"
			label="Photo"
			placeholder="/profile.jpg (put the file in static/, or upload below) or a full URL"
			bind:value={photoSrc}
		/>
		<p class="text-xs text-form-hint">Leave empty to show the initials placeholder instead.</p>
	</div>

	<div class="space-y-1">
		<label for="introParagraphs" class="text-sm font-medium text-field-label">
			Intro text (separate paragraphs with a blank line)
		</label>
		<textarea
			id="introParagraphs"
			name="introParagraphs"
			bind:value={introParagraphs}
			rows="8"
			class="w-full rounded-lg border border-field-border px-3 py-2 font-mono text-sm bg-field text-field-text"
		></textarea>
	</div>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-success">Saved.</p>
	{/if}

	<button
		type="submit"
		disabled={saving}
		class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
	>
		{saving ? 'Saving…' : 'Save changes'}
	</button>
</form>
