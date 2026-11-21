<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import Field from '#lib/components/admin/Field.svelte';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import NewPasswordFields from '#lib/components/admin/NewPasswordFields.svelte';
	import RecoveryKeyCard from '#lib/components/admin/RecoveryKeyCard.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const emailForm = pendingForm();
	const codeForm = pendingForm();
	const tabs = [
		{ id: 'email', label: 'Email Reset Link' },
		{ id: 'code', label: 'Emergency Code' }
	] as const;
	let activeTab: (typeof tabs)[number]['id'] = $state('email');
</script>

<svelte:head>
	<title>Reset Password - Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-md flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Reset Password</h1>
	<p class="mt-1 text-sm text-muted">Choose how you would like to reset your admin password.</p>

	<div class="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-card-border bg-page p-1">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				onclick={() => (activeTab = tab.id)}
				class="rounded-md py-1.5 text-sm transition-colors {activeTab === tab.id
					? 'bg-card font-semibold text-heading shadow-sm'
					: 'font-medium text-muted hover:text-heading'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="card mt-6 p-6">
		{#if activeTab === 'email'}
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
					<Field
						id="identifier"
						label="Username or Email"
						required
						autocomplete="username"
						placeholder="admin or admin@example.com"
					/>
					<FormStatus error={form?.emailError} />
					<SubmitButton
						pending={emailForm.pending}
						label="Send Reset Link"
						pendingLabel="Sending link…"
						class="btn-primary w-full"
					/>
				</form>
			{/if}
		{:else}
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
					<Field
						id="recoveryKey"
						label="Emergency recovery code"
						required
						placeholder="XXXX-XXXX-XXXX-XXXX"
						autocomplete="off"
						class="font-mono uppercase"
					/>
					<NewPasswordFields />
					<FormStatus error={form?.error} />
					<SubmitButton
						pending={codeForm.pending}
						label="Reset Password"
						pendingLabel="Resetting password…"
						class="btn-primary w-full"
					/>
				</form>
			{/if}
		{/if}
	</div>

	<a href={resolve('admin/login')} class="mx-auto mt-6 link-subtle"> ← Return to Login </a>
</section>
