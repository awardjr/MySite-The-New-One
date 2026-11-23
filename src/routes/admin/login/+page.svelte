<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import Field from '#lib/components/admin/Field.svelte';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const loginForm = pendingForm({ refreshAll: (result) => result.type === 'success' });
	let twoFactor = $derived(form?.twoFactor ?? data.twoFactor);
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Admin Login</h1>
	{#if twoFactor}
		<p class="mt-1 text-sm text-muted">
			Enter the 6-digit code from your authenticator app, or one of your backup codes.
		</p>

		<form method="POST" class="mt-6 space-y-4" use:enhance={loginForm.submit}>
			<Field
				id="code"
				label="Authentication code"
				required
				autofocus
				autocomplete="one-time-code"
				autocapitalize="off"
				spellcheck="false"
				maxlength={32}
				class="font-mono tracking-widest"
			/>
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
			<button type="submit" class="link-subtle"> ← Back to password </button>
		</form>
	{:else}
		<p class="mt-1 text-sm text-muted">Sign in to edit this site</p>

		{#if data.passwordReset && !form}
			<p class="mt-4 text-sm text-success">Your password was updated. Sign in with the new one.</p>
		{/if}

		<form method="POST" class="mt-6 space-y-4" use:enhance={loginForm.submit}>
			<Field
				id="username"
				label="Username or Email"
				required
				autocomplete="username"
				value={form?.username ?? ''}
			/>

			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<label for="password" class="text-sm font-medium text-copy"> Password </label>
					<a href={resolve('admin/forgot-password')} class="link-subtle"> Forgot password? </a>
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
