<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import FeaturedPicker from '#lib/components/admin/FeaturedPicker.svelte';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let name = $state(untrack(() => data.home.name));
	let tagline = $state(untrack(() => data.home.tagline));
	let photoSrc = $state(untrack(() => data.home.photoSrc));
	let introParagraphs = $state(untrack(() => data.home.introParagraphs.join('\n\n')));

	let featuredPosts = $state(untrack(() => [...data.home.featuredPosts]));
	let featuredWorks = $state(untrack(() => [...data.home.featuredWorks]));

	const saveForm = pendingForm({ reset: false });
	let showSaved = $derived(!!(form && form.success));

	function clearSaved() {
		showSaved = false;
	}
</script>

<svelte:head>
	<title>Admin - Home</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Home Page</h1>
<p class="mt-1 text-sm text-muted">
	Edit the headline, photo, name, tagline, and intro text shown on the homepage.
</p>

<HeadlineForm
	headline={data.headline}
	saved={!!form?.headlineSuccess}
	headlineLabel="Homepage Greeting"
	headlinePlaceholder="Hi, I'm"
	hint="Shown before your name on the homepage."
	oninput={clearSaved}
/>

<form method="POST" action="?/save" class="mt-6 space-y-5" use:enhance={saveForm.submit}>
	<div class="space-y-1">
		<label for="name" class="text-sm font-medium text-field-label">Name</label>
		<input id="name" name="name" bind:value={name} oninput={clearSaved} required class="input" />
		<p class="text-xs text-form-hint">
			This name is used any place we require name outside of custom content (for now)
		</p>
	</div>

	<div class="space-y-1">
		<label for="tagline" class="text-sm font-medium text-field-label">Tagline</label>
		<input id="tagline" name="tagline" bind:value={tagline} oninput={clearSaved} class="input" />
	</div>

	<div class="space-y-1">
		<ImageUploadField
			id="photoSrc"
			name="photoSrc"
			label="Photo"
			placeholder="/profile.jpg (put the file in static/, or upload below) or a full URL"
			bind:value={photoSrc}
			onchange={clearSaved}
		/>
		<p class="text-xs text-form-hint">Leave empty to show no photo.</p>
	</div>

	<div class="space-y-1">
		<label for="introParagraphs" class="text-sm font-medium text-field-label">
			Intro text (separate paragraphs with a blank line)
		</label>
		<textarea
			id="introParagraphs"
			name="introParagraphs"
			bind:value={introParagraphs}
			oninput={clearSaved}
			rows="8"
			class="input font-mono text-sm"></textarea>
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
		onchange={clearSaved}
		emptyText="No posts yet."
	/>

	<FeaturedPicker
		label="Featured works"
		name="featuredWorks"
		options={data.works.map((w) => ({ id: w.id, title: w.title, image: w.image }))}
		bind:selected={featuredWorks}
		onchange={clearSaved}
		emptyText="No works yet."
	/>

	<FormStatus error={form?.error} saved={showSaved} />

	<SubmitButton pending={saveForm.pending} />
</form>
