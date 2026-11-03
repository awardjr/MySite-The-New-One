<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);
	let twoFactor = $derived(form?.twoFactor ?? data.twoFactor);

	const submitHandler = () => {
		submitting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			submitting = false;
		};
	};
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Admin Login</h1>
	{#if twoFactor}
		<p class="mt-1 text-sm text-muted">
			Enter the 6-digit code from your authenticator app, or your emergency recovery code.
		</p>

		<form method="POST" class="mt-6 space-y-4" use:enhance={submitHandler}>
			<div class="space-y-1">
				<label for="code" class="text-sm font-medium text-copy"> Authentication code </label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					id="code"
					name="code"
					type="text"
					required
					autofocus
					autocomplete="one-time-code"
					autocapitalize="characters"
					spellcheck="false"
					maxlength="32"
					class="w-full rounded-lg border border-field-border px-3 py-2 font-mono tracking-widest text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
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
				{submitting ? 'Verifying…' : 'Verify'}
			</button>
		</form>

		<form method="POST" class="mt-3 text-center" use:enhance={submitHandler}>
			<input type="hidden" name="cancel" value="1" />
			<button
				type="submit"
				class="text-xs text-muted transition-colors hover:text-heading hover:underline"
			>
				← Back to password
			</button>
		</form>
	{:else}
		<p class="mt-1 text-sm text-muted">Sign in to edit this site</p>

		<form method="POST" class="mt-6 space-y-4" use:enhance={submitHandler}>
			<div class="space-y-1">
				<label for="username" class="text-sm font-medium text-copy"> Username or Email </label>
				<input
					id="username"
					name="username"
					type="text"
					required
					autocomplete="username"
					value={form?.username ?? ''}
					class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
				/>
			</div>

			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<label for="password" class="text-sm font-medium text-copy"> Password </label>
					<a
						href={resolve('admin/forgot-password')}
						class="text-xs text-muted transition-colors hover:text-heading hover:underline"
					>
						Forgot password?
					</a>
				</div>
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
	{/if}
</section>
