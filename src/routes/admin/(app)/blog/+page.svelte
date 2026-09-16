<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let deletingSlug = $state<string | null>(null);
</script>

<svelte:head>
	<title>Admin - Posts</title>
</svelte:head>

<div class="flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-heading">Blog Posts</h1>
		<p class="mt-1 text-sm text-muted">Create, edit, or remove posts shown on the public blog.</p>
	</div>
	<a
		href="/admin/blog/new"
		class="shrink-0 rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover"
	>
		New Post
	</a>
</div>

{#if form?.error}
	<p class="mt-4 text-sm text-error">{form.error}</p>
{/if}

<div class="mt-6 space-y-3">
	{#each data.posts as post (post.slug)}
		<div
			class="flex flex-col gap-2 rounded-lg border border-form-border p-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="min-w-0">
				<p class="truncate font-semibold text-heading">{post.title}</p>
				<p class="text-sm text-subtle">{post.date} &middot; /{post.slug}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<a
					href="/admin/blog/{post.slug}"
					class="rounded-lg border border-field-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary-hover"
				>
					Edit
				</a>
				<form
					method="POST"
					action="?/delete"
					onsubmit={(event) => {
						if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
							event.preventDefault();
						}
					}}
					use:enhance={() => {
						deletingSlug = post.slug;
						return async ({ update }) => {
							await update();
							deletingSlug = null;
						};
					}}
				>
					<input type="hidden" name="slug" value={post.slug} />
					<button
						type="submit"
						disabled={deletingSlug === post.slug}
						class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover disabled:opacity-60"
					>
						{deletingSlug === post.slug ? 'Deleting…' : 'Delete'}
					</button>
				</form>
			</div>
		</div>
	{:else}
		<p class="text-sm text-subtle">No posts yet. Create your first one!</p>
	{/each}
</div>
