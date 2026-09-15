<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let saving = $state(false);
</script>

<svelte:head>
	<title>Admin - Settings</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Settings</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Change the password used to sign in to <code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-900 hotdog:bg-red-800"
		>/admin</code
	>.
</p>

<form
	method="POST"
	class="mt-6 max-w-sm space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="currentPassword" class="text-sm font-medium text-gray-700 dark:text-gray-300 hotdog:text-yellow-100">
			Current password
		</label>
		<input
			id="currentPassword"
			name="currentPassword"
			type="password"
			required
			autocomplete="current-password"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="newPassword" class="text-sm font-medium text-gray-700 dark:text-gray-300 hotdog:text-yellow-100">
			New password
		</label>
		<input
			id="newPassword"
			name="newPassword"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	<div class="space-y-1">
		<label for="confirmPassword" class="text-sm font-medium text-gray-700 dark:text-gray-300 hotdog:text-yellow-100">
			Confirm new password
		</label>
		<input
			id="confirmPassword"
			name="confirmPassword"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
		/>
	</div>

	{#if form?.error}
		<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-green-600 dark:text-green-400">Password updated.</p>
	{/if}

	<button
		type="submit"
		disabled={saving}
		class="rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
	>
		{saving ? 'Updating…' : 'Update password'}
	</button>
</form>
