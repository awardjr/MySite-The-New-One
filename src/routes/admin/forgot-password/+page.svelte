<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let sendingEmail = $state(false);
	let resettingCode = $state(false);
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
		<div class="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
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
					use:enhance={() => {
						sendingEmail = true;
						return async ({ update }) => {
							await update();
							sendingEmail = false;
						};
					}}
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
							class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
						/>
					</div>

					{#if form?.emailError}
						<p class="text-sm text-error">{form.emailError}</p>
					{/if}

					<button
						type="submit"
						disabled={sendingEmail}
						class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
					>
						{sendingEmail ? 'Sending link…' : 'Send Reset Link'}
					</button>
				</form>
			{/if}
		</div>
	{/if}

	<!-- Option 2: Emergency Code -->
	{#if activeTab === 'code'}
		<div class="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
			<h2 class="text-base font-semibold text-heading">Reset with Emergency Code</h2>
			<p class="mt-1 text-xs text-muted">
				Enter the 16-character recovery code generated when your account was configured.
			</p>

			{#if !data.hasRecoveryKey}
				<p class="mt-4 text-sm text-error">
					No emergency recovery code is configured for this admin account.
				</p>
			{:else}
				<form
					method="POST"
					action="?/resetWithRecoveryKey"
					class="mt-4 space-y-4"
					use:enhance={() => {
						resettingCode = true;
						return async ({ update }) => {
							await update();
							resettingCode = false;
						};
					}}
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
							class="w-full rounded-lg border border-field-border px-3 py-2 font-mono uppercase text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
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
							class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
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
							class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
						/>
					</div>

					{#if form?.error}
						<p class="text-sm text-error">{form.error}</p>
					{/if}

					<button
						type="submit"
						disabled={resettingCode}
						class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
					>
						{resettingCode ? 'Resetting password…' : 'Reset Password & Sign In'}
					</button>
				</form>
			{/if}
		</div>
	{/if}

	<div class="mt-6 text-center">
		<a
			href={resolve('/admin/login')}
			class="text-xs text-muted transition-colors hover:text-heading hover:underline"
		>
			← Return to Login
		</a>
	</div>
</section>
