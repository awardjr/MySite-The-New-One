<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let saving = $state(false);
</script>

<svelte:head>
	<title>Admin - Settings</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Settings</h1>
<p class="mt-1 text-sm text-muted">
	Change the password used to sign in to <code class="rounded bg-code px-1 py-0.5 font-mono text-xs"
		>/admin</code
	>.
</p>

<form
	method="POST"
	class="mt-6 space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="currentPassword" class="text-sm font-medium text-copy"> Current password </label>
		<input
			id="currentPassword"
			name="currentPassword"
			type="password"
			required
			autocomplete="current-password"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<label for="newPassword" class="text-sm font-medium text-copy"> New password </label>
		<input
			id="newPassword"
			name="newPassword"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	<div class="space-y-1">
		<label for="confirmPassword" class="text-sm font-medium text-copy">
			Confirm new password
		</label>
		<input
			id="confirmPassword"
			name="confirmPassword"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
	</div>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-success">Password updated.</p>
	{/if}

	<button
		type="submit"
		disabled={saving}
		class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
	>
		{saving ? 'Updating…' : 'Update password'}
	</button>
</form>
