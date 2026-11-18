<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import PostForm from '../PostForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const deleteForm = pendingForm();
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

<PostForm post={data.post} {form} action="?/update" />

<div class="mt-10 rounded-lg border border-danger-border p-4">
	<h2 class="text-sm font-semibold text-danger-heading">Danger zone</h2>
	<p class="mt-1 text-sm text-muted">Permanently delete this post. This cannot be undone.</p>
	<form
		action="?/delete"
		class="mt-3"
		method="POST"
		use:enhance={(submission) => {
			if (!confirm(`Delete "${data.post.title}"? This cannot be undone.`)) {
				submission.cancel();
				return;
			}
			return deleteForm.submit(submission);
		}}
	>
		<SubmitButton
			pending={deleteForm.pending}
			label="Delete Post"
			pendingLabel="Deleting…"
			class="rounded-lg border border-danger-button-border px-4 py-2 text-sm text-danger-text transition-colors hover:bg-danger-hover disabled:opacity-60"
		/>
	</form>
</div>
