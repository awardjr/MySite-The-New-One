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
	<h1 class="text-2xl font-bold tracking-tight text-heading">Create Admin Password</h1>
	<p class="mt-1 text-sm text-muted">
		No admin password exists yet. Choose one now to secure the <code
			class="rounded bg-code px-1 py-0.5 font-mono text-xs">/admin</code
		> site
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
			<label for="password" class="text-sm font-medium text-copy"> Password </label>
			<input
				id="password"
				name="password"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
				class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
			/>
		</div>

		<div class="space-y-1">
			<label for="confirmPassword" class="text-sm font-medium text-copy"> Confirm Password </label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
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
			{submitting ? 'Creating…' : 'Create Password & Sign In'}
		</button>
	</form>
</section>
