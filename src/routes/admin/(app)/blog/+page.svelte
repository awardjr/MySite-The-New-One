<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let deletingSlug = $state<string | null>(null);
</script>

<svelte:head>
	<title>Admin - Blog</title>
</svelte:head>

<div class="flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Blog Posts</h1>
		<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
			Create, edit, or remove posts shown on the public blog.
		</p>
	</div>
	<a
		href="/admin/blog/new"
		class="shrink-0 rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
	>
		New Post
	</a>
</div>

{#if form?.error}
	<p class="mt-4 text-sm text-red-600 dark:text-red-400">{form.error}</p>
{/if}

<div class="mt-6 space-y-3">
	{#each data.posts as post (post.slug)}
		<div
			class="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
		>
			<div class="min-w-0">
				<p class="truncate font-semibold text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">{post.title}</p>
				<p class="text-sm text-gray-500 dark:text-gray-400 hotdog:text-yellow-100">{post.date} &middot; /{post.slug}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<a
					href="/admin/blog/{post.slug}"
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
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
						class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-red-950"
					>
						{deletingSlug === post.slug ? 'Deleting…' : 'Delete'}
					</button>
				</form>
			</div>
		</div>
	{:else}
		<p class="text-sm text-gray-500 dark:text-gray-400 hotdog:text-yellow-100">No posts yet. Create your first one!</p>
	{/each}
</div>
