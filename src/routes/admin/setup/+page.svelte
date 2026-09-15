<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin Setup</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">
		Create Admin Password
	</h1>
	<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
		No admin password exists yet. Choose one now to secure the <code
			class="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-900 hotdog:bg-red-800">/admin</code
		> area — it's stored (hashed) in the site's SQLite database.
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
				minlength="8"
				autocomplete="new-password"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</div>

		<div class="space-y-1">
			<label
				for="confirmPassword"
				class="text-sm font-medium text-gray-700 dark:text-gray-300 hotdog:text-yellow-100"
			>
				Confirm Password
			</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
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
			{submitting ? 'Creating…' : 'Create Password & Sign In'}
		</button>
	</form>
</section>
