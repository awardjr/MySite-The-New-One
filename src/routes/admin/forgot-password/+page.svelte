<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import { resolve } from '$app/paths';
	import RecoveryKeyCard from '#lib/components/admin/RecoveryKeyCard.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const emailForm = pendingForm();
	const codeForm = pendingForm();
	let activeTab = $state<'email' | 'code'>('email');
</script>

<svelte:head>
	<title>Reset Password - Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-md flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Reset Password</h1>

	<p class="mt-1 text-sm text-muted">Choose how you would like to reset your admin password.</p>
	<!-- Tabs for selecting recovery method -->
	<div class="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-card-border bg-page p-1">
		<button
			type="button"
			onclick={() => (activeTab = 'email')}
			class="rounded-md py-1.5 text-sm font-medium transition-colors {activeTab === 'email'
				? 'bg-card font-semibold text-heading shadow-sm'
				: 'text-muted hover:text-heading'}"
		>
			Email Reset Link
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'code')}
			class="rounded-md py-1.5 text-sm font-medium transition-colors {activeTab === 'code'
				? 'bg-card font-semibold text-heading shadow-sm'
				: 'text-muted hover:text-heading'}"
		>
			Emergency Code
		</button>
	</div>

	<!-- Option 1: Email Reset Link -->
	{#if activeTab === 'email'}
		<div class="card mt-6 p-6">
			<h2 class="text-base font-semibold text-heading">Email a Reset Link</h2>
			<p class="mt-1 text-xs text-muted">
				Enter your admin username or email address and we will send a password reset link to your
				email.
			</p>

			{#if form?.emailSent}
				<div class="mt-4 rounded-lg border border-card-border bg-page p-4 text-sm text-success">
					If the username or email address matches our records, a password reset link has been
					dispatched. Please check your inbox (and server logs).
				</div>
			{:else}
				<form
					method="POST"
					action="?/requestEmailLink"
					class="mt-4 space-y-4"
					use:enhance={emailForm.submit}
				>
					<div class="space-y-1">
						<label for="identifier" class="text-sm font-medium text-copy">
							Username or Email
						</label>
						<input
							id="identifier"
							name="identifier"
							type="text"
							required
							autocomplete="username"
							placeholder="admin or admin@example.com"
							class="input-auth"
						/>
					</div>

					<FormStatus error={form?.emailError} />

					<SubmitButton
						pending={emailForm.pending}
						label="Send Reset Link"
						pendingLabel="Sending link…"
						class="btn-primary w-full"
					/>
				</form>
			{/if}
		</div>
	{/if}

	<!-- Option 2: Emergency Code -->
	{#if activeTab === 'code'}
		<div class="card mt-6 p-6">
			<h2 class="text-base font-semibold text-heading">Reset with Emergency Code</h2>
			<p class="mt-1 text-xs text-muted">
				Enter the 16-character recovery code generated when your account was configured.
			</p>

			{#if form?.passwordReset && form.newRecoveryKey}
				<p class="mt-4 text-sm text-success">
					Your password was updated. The recovery code you used no longer works.
				</p>

				<RecoveryKeyCard
					recoveryKey={form.newRecoveryKey}
					title="New Emergency Recovery Code"
					class="mt-4"
				>
					Save this code somewhere safe now. It won't be shown again. If two-factor authentication
					is on and you can't use your authenticator, enter this code when signing in.
				</RecoveryKeyCard>

				<a href={resolve('admin/login')} class="btn-primary mt-4 inline-block w-full text-center">
					Continue to Sign In
				</a>
			{:else}
				<form
					method="POST"
					action="?/resetWithRecoveryKey"
					class="mt-4 space-y-4"
					use:enhance={codeForm.submit}
				>
					<div class="space-y-1">
						<label for="recoveryKey" class="text-sm font-medium text-copy">
							Emergency recovery code
						</label>
						<input
							id="recoveryKey"
							name="recoveryKey"
							type="text"
							required
							placeholder="XXXX-XXXX-XXXX-XXXX"
							autocomplete="off"
							class="input-auth font-mono uppercase"
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
							class="input-auth"
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
							class="input-auth"
						/>
					</div>

					<FormStatus error={form?.error} />

					<SubmitButton
						pending={codeForm.pending}
						label="Reset Password"
						pendingLabel="Resetting password…"
						class="btn-primary w-full"
					/>
				</form>
			{/if}
		</div>
	{/if}

	<div class="mt-6 text-center">
		<a
			href={resolve('admin/login')}
			class="text-xs text-muted transition-colors hover:text-heading hover:underline"
		>
			← Return to Login
		</a>
	</div>
</section>
