<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import { resolve } from '$app/paths';
	import RecoveryKeyCard from '#lib/components/admin/RecoveryKeyCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const loginForm = pendingForm({
		// Signed in with a recovery code: show its replacement instead of reloading the page,
		// which would redirect straight to the dashboard now that a session exists.
		refreshAll: (result) => result.type === 'success' && !result.data?.newRecoveryKey
	});
	let twoFactor = $derived(form?.twoFactor ?? data.twoFactor);
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Admin Login</h1>
	{#if form?.newRecoveryKey}
		<p class="mt-1 text-sm text-muted">
			You are signed in. The recovery code you used no longer works.
		</p>

		<RecoveryKeyCard
			recoveryKey={form.newRecoveryKey}
			title="New Emergency Recovery Code"
			class="mt-6"
		>
			Save this code somewhere safe now. It won't be shown again, and it replaces the one you just
			used.
		</RecoveryKeyCard>

		<!-- A full page load, so the new session is picked up. -->
		<a
			href={form.continueTo ?? resolve('admin')}
			data-sveltekit-reload
			class="btn-primary mt-6 inline-block w-full text-center"
		>
			Continue to Admin Dashboard
		</a>
	{:else if twoFactor}
		<p class="mt-1 text-sm text-muted">
			Enter the 6-digit code from your authenticator app, or your emergency recovery code.
		</p>

		<form method="POST" class="mt-6 space-y-4" use:enhance={loginForm.submit}>
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
					class="input-auth font-mono tracking-widest"
				/>
			</div>

			<FormStatus error={form?.error} />

			<SubmitButton
				pending={loginForm.pending}
				label="Verify"
				pendingLabel="Verifying…"
				class="btn-primary w-full"
			/>
		</form>

		<form method="POST" class="mt-3 text-center" use:enhance={loginForm.submit}>
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

		{#if data.passwordReset && !form}
			<p class="mt-4 text-sm text-success">Your password was updated. Sign in with the new one.</p>
		{/if}

		<form method="POST" class="mt-6 space-y-4" use:enhance={loginForm.submit}>
			<div class="space-y-1">
				<label for="username" class="text-sm font-medium text-copy"> Username or Email </label>
				<input
					id="username"
					name="username"
					type="text"
					required
					autocomplete="username"
					value={form?.username ?? ''}
					class="input-auth"
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
					class="input-auth"
				/>
			</div>

			<FormStatus error={form?.error} />

			<SubmitButton
				pending={loginForm.pending}
				label="Sign in"
				pendingLabel="Signing in…"
				class="btn-primary w-full"
			/>
		</form>
	{/if}
</section>
