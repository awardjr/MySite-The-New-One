<script lang="ts">
	import AdminHeading from '#lib/components/admin/AdminHeading.svelte';
	import PostForm from '../PostForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const emptyPost = {
		title: '',
		date: new Date().toLocaleDateString('en-CA'),
		image: '',
		preview: '',
		content: '',
		draft: false
	};
</script>

<AdminHeading title="New Post">Create a new blog post.</AdminHeading>

<PostForm post={emptyPost} {form} showSlug submitLabel="Create Post" pendingLabel="Creating…" />
