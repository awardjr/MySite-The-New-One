<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { enhance } from '$app/forms';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();

	const deletingSlugs = new SvelteSet<string>();
</script>

<svelte:head>
	<title>Admin - Posts</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Blog Posts</h1>
<p class="mt-1 text-sm text-muted">
	Edit the page headline, subtitle, and posts shown on the public blog.
</p>

<HeadlineForm
	headline={data.headline}
	subtitle={data.subtitle}
	saved={!!form?.headlineSuccess}
	headlinePlaceholder="Blog"
/>

<div class="mt-6 flex items-center justify-between">
	<div>
		<h2 class="text-lg font-semibold text-heading">Posts</h2>
		<p class="text-sm text-muted">Create, edit, or remove posts.</p>
	</div>
	<a href={resolve('admin/blog/new')} class="btn-primary shrink-0"> New Post </a>
</div>

<FormStatus error={form?.error} class="mt-4" />

<div class="mt-6 space-y-3">
	{#each data.posts as post (post.slug)}
		<div
			class="flex flex-col gap-2 rounded-lg border border-form-border p-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="min-w-0">
				<p class="flex items-center gap-2 truncate font-semibold text-heading">
					{post.title}
					{#if post.draft}
						<span
							class="shrink-0 rounded-full bg-secondary-hover px-2 py-0.5 text-xs font-medium text-form-hint"
						>
							Draft
						</span>
					{/if}
				</p>
				<p class="text-sm text-subtle">{post.date} · /{post.slug}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<a
					href={resolve('/blog/[slug]', { slug: post.slug })}
					target="_blank"
					rel="noopener noreferrer"
					class="btn-secondary px-3 py-1.5"
				>
					Preview
				</a>
				<a
					href={resolve('/admin/(app)/blog/[slug]', { slug: post.slug })}
					class="btn-secondary px-3 py-1.5"
				>
					Edit
				</a>
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
							cancel();
							return;
						}
						const { slug } = post;
						deletingSlugs.add(slug);
						return async ({ update }) => {
							await update();
							deletingSlugs.delete(slug);
						};
					}}
				>
					<input type="hidden" name="slug" value={post.slug} />
					<SubmitButton
						pending={deletingSlugs.has(post.slug)}
						label="Delete"
						pendingLabel="Deleting…"
						class="btn-remove"
					/>
				</form>
			</div>
		</div>
	{:else}
		<p class="text-sm text-subtle">No posts yet. Create your first one!</p>
	{/each}
</div>
