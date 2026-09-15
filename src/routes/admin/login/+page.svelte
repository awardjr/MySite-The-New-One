<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Admin Login</h1>
	<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
		Sign in to edit the content of this site.
	</p>

	<form
		method="POST"
		class="mt-6 space-y-4"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<div class="space-y-1">
			<label for="password" class="text-sm font-medium text-gray-700 dark:text-gray-300 hotdog:text-yellow-100">
				Password
			</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="current-password"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</div>

		{#if form?.error}
			<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
		>
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>
</section>
