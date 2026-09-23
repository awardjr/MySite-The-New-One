<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingProfile = $state(false);
	let savingPassword = $state(false);
	let rotatingRecovery = $state(false);
	let copied = $state(false);

	async function copyRecoveryKey(key: string) {
		try {
			await navigator.clipboard.writeText(key);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Clipboard API not available
		}
	}
</script>

<svelte:head>
	<title>Admin - Settings</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Settings</h1>
<p class="mt-1 text-sm text-muted">
	Manage your admin profile, credentials, and emergency account recovery options.
</p>

<div class="mt-8 space-y-10">
	<!-- Profile Settings -->
	<section class="rounded-xl border border-card-border bg-card p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-heading">Account Profile</h2>
		<p class="mt-1 text-xs text-muted">
			Update your admin username and email address used for notifications and password recovery.
		</p>

		<form
			method="POST"
			action="?/updateProfile"
			class="mt-6 space-y-4"
			use:enhance={() => {
				savingProfile = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingProfile = false;
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<label for="username" class="text-sm font-medium text-copy"> Username </label>
					<input
						id="username"
						name="username"
						type="text"
						required
						autocomplete="username"
						value={data.username}
						class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
					/>
				</div>

				<div class="space-y-1">
					<label for="email" class="text-sm font-medium text-copy"> Email address </label>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						value={data.email}
						class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
					/>
				</div>
			</div>

			{#if form?.profileError}
				<p class="text-sm text-error">{form.profileError}</p>
			{:else if form?.profileSuccess}
				<p class="text-sm text-success">Profile updated successfully.</p>
			{/if}

			<button
				type="submit"
				disabled={savingProfile}
				class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
			>
				{savingProfile ? 'Saving…' : 'Save Profile'}
			</button>
		</form>
	</section>

	<!-- Change Password -->
	<section class="rounded-xl border border-card-border bg-card p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-heading">Change Password</h2>
		<p class="mt-1 text-xs text-muted">
			Update the password used to sign in to <code
				class="rounded bg-code px-1 py-0.5 font-mono text-xs">/admin</code
			>.
		</p>

		<form
			method="POST"
			action="?/changePassword"
			class="mt-6 space-y-4"
			use:enhance={() => {
				savingPassword = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingPassword = false;
				};
			}}
		>
			<div class="space-y-1">
				<label for="currentPassword" class="text-sm font-medium text-copy">
					Current password
				</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
				/>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<label for="newPassword" class="text-sm font-medium text-copy"> New password </label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
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
						class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
					/>
				</div>
			</div>

			{#if form?.passwordError}
				<p class="text-sm text-error">{form.passwordError}</p>
			{:else if form?.passwordSuccess}
				<p class="text-sm text-success">Password updated successfully.</p>
			{/if}

			<button
				type="submit"
				disabled={savingPassword}
				class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
			>
				{savingPassword ? 'Updating…' : 'Update Password'}
			</button>
		</form>
	</section>

	<!-- Emergency Recovery Code -->
	<section class="rounded-xl border border-card-border bg-card p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-heading">Emergency Recovery Code</h2>
		<p class="mt-1 text-xs text-muted">
			An emergency recovery code allows you to regain access to your admin account if you forget
			your password and cannot receive reset emails.
		</p>

		{#if form?.recoverySuccess && form.newRecoveryKey}
			<div class="my-5 rounded-lg border border-card-border bg-page p-4">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-muted">
						New Emergency Recovery Code
					</span>
					<button
						type="button"
						onclick={() => copyRecoveryKey(form?.newRecoveryKey ?? '')}
						class="text-xs font-medium text-muted hover:text-heading transition-colors"
					>
						{copied ? 'Copied!' : 'Copy code'}
					</button>
				</div>
				<p
					class="mt-2 font-mono text-lg font-bold tracking-wider text-heading selection:bg-nav-active"
				>
					{form.newRecoveryKey}
				</p>
			</div>
			<p class="text-xs text-success">
				New recovery code generated. Previous recovery codes are now invalidated.
			</p>
		{/if}

		<form
			method="POST"
			action="?/rotateRecoveryKey"
			class="mt-6 space-y-4"
			use:enhance={() => {
				rotatingRecovery = true;
				return async ({ update }) => {
					await update({ reset: false });
					rotatingRecovery = false;
				};
			}}
		>
			<div class="space-y-1">
				<label for="recoveryCurrentPassword" class="text-sm font-medium text-copy">
					Current password (required to generate new code)
				</label>
				<input
					id="recoveryCurrentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="w-full max-w-sm rounded-lg border border-field-border px-3 py-2 bg-field text-field-text focus:border-field-focus focus:outline-none"
				/>
			</div>

			{#if form?.recoveryError}
				<p class="text-sm text-error">{form.recoveryError}</p>
			{/if}

			<button
				type="submit"
				disabled={rotatingRecovery}
				class="rounded-lg border border-card-border bg-page px-4 py-2 text-sm font-medium text-copy transition-colors hover:bg-nav-surface-hover hover:text-heading disabled:opacity-60"
			>
				{rotatingRecovery ? 'Generating…' : 'Generate New Recovery Code'}
			</button>
		</form>
	</section>
</div>
