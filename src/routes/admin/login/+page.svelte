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
	<h1 class="text-2xl font-bold tracking-tight text-heading">Admin Login</h1>
	<p class="mt-1 text-sm text-muted">Sign in to edit this site</p>

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
			<label for="password" class="text-sm font-medium text-copy"> Password </label>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="current-password"
				class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
			/>
		</div>

		{#if form?.error}
			<p class="text-sm text-error">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>
</section>
