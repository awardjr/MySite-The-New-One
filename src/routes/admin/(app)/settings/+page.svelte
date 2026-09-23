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

<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Settings</h1>
<p class="mt-2 text-base text-muted sm:text-lg">
	Manage your admin profile, credentials, and emergency account recovery options.
</p>

<div class="mt-8 space-y-10">
	<!-- Profile Settings -->
	<section class="rounded-xl border border-form-border bg-page p-6 sm:p-8 shadow-sm">
		<h2 class="text-xl font-bold text-heading sm:text-2xl">Account Profile</h2>
		<p class="mt-1.5 text-base text-muted">
			Update your admin username and email address used for notifications and password recovery.
		</p>

		<form
			method="POST"
			action="?/updateProfile"
			class="mt-6 space-y-5"
			use:enhance={() => {
				savingProfile = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingProfile = false;
				};
			}}
		>
			<div class="grid gap-5 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="username" class="text-base font-medium text-field-label"> Username </label>
					<input
						id="username"
						name="username"
						type="text"
						required
						autocomplete="username"
						value={data.username}
						class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>

				<div class="space-y-2">
					<label for="email" class="text-base font-medium text-field-label"> Email address </label>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						value={data.email}
						class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>
			</div>

			{#if form?.profileError}
				<p class="text-base font-medium text-error">{form.profileError}</p>
			{:else if form?.profileSuccess}
				<p class="text-base font-medium text-success">Profile updated successfully.</p>
			{/if}

			<div>
				<button
					type="submit"
					disabled={savingProfile}
					class="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
				>
					{savingProfile ? 'Saving…' : 'Save Profile'}
				</button>
			</div>
		</form>
	</section>

	<!-- Change Password -->
	<section class="rounded-xl border border-form-border bg-page p-6 sm:p-8 shadow-sm">
		<h2 class="text-xl font-bold text-heading sm:text-2xl">Change Password</h2>
		<p class="mt-1.5 text-base text-muted">
			Update the password used to sign in to <code
				class="rounded bg-code px-1.5 py-0.5 font-mono text-sm text-heading">/admin</code
			>.
		</p>

		<form
			method="POST"
			action="?/changePassword"
			class="mt-6 space-y-5"
			use:enhance={() => {
				savingPassword = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingPassword = false;
				};
			}}
		>
			<div class="space-y-2">
				<label for="currentPassword" class="text-base font-medium text-field-label">
					Current password
				</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
				/>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="newPassword" class="text-base font-medium text-field-label"> New password </label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>

				<div class="space-y-2">
					<label for="confirmPassword" class="text-base font-medium text-field-label">
						Confirm new password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>
			</div>

			{#if form?.passwordError}
				<p class="text-base font-medium text-error">{form.passwordError}</p>
			{:else if form?.passwordSuccess}
				<p class="text-base font-medium text-success">Password updated successfully.</p>
			{/if}

			<div>
				<button
					type="submit"
					disabled={savingPassword}
					class="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
				>
					{savingPassword ? 'Updating…' : 'Update Password'}
				</button>
			</div>
		</form>
	</section>

	<!-- Emergency Recovery Code -->
	<section class="rounded-xl border border-form-border bg-page p-6 sm:p-8 shadow-sm">
		<h2 class="text-xl font-bold text-heading sm:text-2xl">Emergency Recovery Code</h2>
		<p class="mt-1.5 text-base text-muted">
			An emergency recovery code allows you to regain access to your admin account if you forget
			your password and cannot receive reset emails.
		</p>

		{#if form?.recoverySuccess && form.newRecoveryKey}
			<div class="my-6 rounded-xl border border-card-border bg-card p-5">
				<div class="flex items-center justify-between">
					<span class="text-sm font-bold uppercase tracking-wider text-card-meta">
						New Emergency Recovery Code
					</span>
					<button
						type="button"
						onclick={() => copyRecoveryKey(form?.newRecoveryKey ?? '')}
						class="text-sm font-semibold text-card-action hover:text-card-heading transition-colors"
					>
						{copied ? 'Copied!' : 'Copy code'}
					</button>
				</div>
				<p
					class="mt-3 font-mono text-2xl font-bold tracking-widest text-card-heading selection:bg-nav-active"
				>
					{form.newRecoveryKey}
				</p>
			</div>
			<p class="text-base font-medium text-success">
				New recovery code generated. Previous recovery codes are now invalidated.
			</p>
		{/if}

		<form
			method="POST"
			action="?/rotateRecoveryKey"
			class="mt-6 space-y-5"
			use:enhance={() => {
				rotatingRecovery = true;
				return async ({ update }) => {
					await update({ reset: false });
					rotatingRecovery = false;
				};
			}}
		>
			<div class="space-y-2">
				<label for="recoveryCurrentPassword" class="text-base font-medium text-field-label">
					Current password (required to generate new code)
				</label>
				<input
					id="recoveryCurrentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="w-full max-w-md rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
				/>
			</div>

			{#if form?.recoveryError}
				<p class="text-base font-medium text-error">{form.recoveryError}</p>
			{/if}

			<div>
				<button
					type="submit"
					disabled={rotatingRecovery}
					class="rounded-lg border border-field-border bg-field px-5 py-2.5 text-base font-semibold text-field-label transition-colors hover:bg-secondary-hover hover:text-heading disabled:opacity-60"
				>
					{rotatingRecovery ? 'Generating…' : 'Generate New Recovery Code'}
				</button>
			</div>
		</form>
	</section>
</div>
