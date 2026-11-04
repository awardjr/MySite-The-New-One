<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import FeaturedPicker from '#lib/components/admin/FeaturedPicker.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

 let name = $state(untrack(() => data.home.name));
 let headline = $state(untrack(() => data.headline));
 let tagline = $state(untrack(() => data.home.tagline));
 let photoSrc = $state(untrack(() => data.home.photoSrc));
 let introParagraphs = $state(untrack(() => data.home.introParagraphs.join('\n\n')));

	let featuredPosts = $state(untrack(() => [...data.home.featuredPosts]));
	let featuredWorks = $state(untrack(() => [...data.home.featuredWorks]));

	let saving = $state(false);
	let savingHeadline = $state(false);
</script>

<svelte:head>
	<title>Admin - Home</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Home Page</h1>
<p class="mt-1 text-sm text-muted">
	Edit the headline, photo, name, tagline, and intro text shown on the homepage.
</p>

<form
	method="POST"
	class="mt-4 space-y-3 rounded-xl border border-form-border p-4"
	use:enhance={() => {
		savingHeadline = true;
		return async ({ update }) => {
			await update({ reset: false });
			savingHeadline = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="headline" class="text-sm font-medium text-field-label">Homepage Greeting</label>
		<input
			id="headline"
			name="headline"
			bind:value={headline}
			placeholder="Hi, I'm"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
		<p class="text-xs text-form-hint">Shown before your name on the homepage.</p>
	</div>

	<div>
		<button
			type="submit"
			name="action"
			value="saveHeadline"
			disabled={savingHeadline}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{savingHeadline ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>

{#if form?.headlineError}
	<p class="mt-2 text-sm text-error">{form.headlineError}</p>
{:else if form?.headlineSuccess}
	<p class="mt-2 text-sm text-success">Saved.</p>
{/if}

<form
	method="POST"
	class="mt-6 space-y-5"
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
		<p class="text-xs text-form-hint">This name is used any place we require name outside of custom content (for now)</p>
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

	<FeaturedPicker
		label="Featured posts"
		name="featuredPosts"
		options={data.posts.map((p) => ({
			id: p.slug,
			title: p.title,
			image: p.image,
			note: p.draft ? ' (draft)' : ''
		}))}
		bind:selected={featuredPosts}
		emptyText="No posts yet."
	/>

	<FeaturedPicker
		label="Featured works"
		name="featuredWorks"
		options={data.works.map((w) => ({ id: w.id, title: w.title, image: w.image }))}
		bind:selected={featuredWorks}
		emptyText="No works yet."
	/>

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
