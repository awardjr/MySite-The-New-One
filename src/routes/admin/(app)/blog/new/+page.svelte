<script lang="ts">
	import PostForm from '../PostForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const today = new Date();
	const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	const emptyPost = {
		title: '',
		date: todayString,
		image: '',
		preview: '',
		content: '',
		draft: false
	};
</script>

<svelte:head>
	<title>Admin - New Post</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">New Post</h1>
<p class="mt-1 text-sm text-muted">Create a new blog post.</p>

<PostForm post={emptyPost} {form} showSlug submitLabel="Create Post" pendingLabel="Creating…" />
