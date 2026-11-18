<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import SettingsField from './SettingsField.svelte';
	import RecoveryKeyCard from '#lib/components/admin/RecoveryKeyCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const profileForm = pendingForm({ reset: false });
	const passwordForm = pendingForm({ reset: false });
	const recoveryForm = pendingForm({ reset: false });
	const twoFactorForm = pendingForm();
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
			Because password reset links are sent to this address, changes need your current password.
		</p>

		<form
			method="POST"
			action="?/updateProfile"
			class="mt-6 space-y-5"
			use:enhance={profileForm.submit}
		>
			<div class="grid gap-5 sm:grid-cols-2">
				<SettingsField
					label="Username"
					id="username"
					name="username"
					type="text"
					required
					autocomplete="username"
					value={data.username}
				/>

				<SettingsField
					label="Email address"
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					value={data.email}
				/>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<SettingsField
					label="Current password (required to change your profile)"
					id="profileCurrentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
				/>

				{#if data.twoFactorEnabled}
					<SettingsField
						label="Authentication or recovery code"
						id="profileTwoFactorCode"
						name="code"
						type="text"
						required
						autocomplete="one-time-code"
						spellcheck="false"
						maxlength={32}
						class="font-mono tracking-widest"
					/>
				{/if}
			</div>

			<FormStatus
				large
				error={form?.profileError}
				saved={form?.profileSuccess && 'Profile updated successfully.'}
			/>

			<div>
				<SubmitButton pending={profileForm.pending} label="Save Profile" class="btn-primary-lg" />
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
			use:enhance={passwordForm.submit}
		>
			<SettingsField
				label="Current password"
				id="currentPassword"
				name="currentPassword"
				type="password"
				required
				autocomplete="current-password"
			/>

			<div class="grid gap-5 sm:grid-cols-2">
				<SettingsField
					label="New password"
					id="newPassword"
					name="newPassword"
					type="password"
					required
					minlength={8}
					autocomplete="new-password"
				/>

				<SettingsField
					label="Confirm new password"
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					required
					minlength={8}
					autocomplete="new-password"
				/>
			</div>

			<FormStatus
				large
				error={form?.passwordError}
				saved={form?.passwordSuccess && 'Password updated successfully.'}
			/>

			<div>
				<SubmitButton
					pending={passwordForm.pending}
					label="Update Password"
					pendingLabel="Updating…"
					class="btn-primary-lg"
				/>
			</div>
		</form>
	</section>

	<!-- Two-Factor Authentication -->
	<section class="rounded-xl border border-form-border bg-page p-6 sm:p-8 shadow-sm">
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="text-xl font-bold text-heading sm:text-2xl">Two-Factor Authentication</h2>
			<span
				class="rounded-full bg-badge px-2.5 py-0.5 text-sm font-semibold {data.twoFactorEnabled
					? 'text-success'
					: 'text-muted'}"
			>
				{data.twoFactorEnabled ? 'On' : 'Off'}
			</span>
		</div>
		<p class="mt-1.5 text-base text-muted">
			When on, signing in also needs a 6-digit code from an authenticator app such as Google
			Authenticator, 1Password or Authy. If you lose access to the app, you can sign in with your
			emergency recovery code instead.
		</p>
		{#if !data.twoFactorKeyConfigured}
			<p class="mt-3 text-base text-error">
				TOTP_ENCRYPTION_KEY is not configured. New two-factor setups are unavailable; if your
				existing secret is encrypted, restore its original key to use authenticator codes. Your
				emergency recovery code can still be used to sign in and turn two-factor authentication off.
			</p>
		{/if}

		{#if data.twoFactorEnabled}
			{#if form?.twoFactorRecoveryKey}
				<RecoveryKeyCard
					recoveryKey={form.twoFactorRecoveryKey}
					title="Your Emergency Recovery Code"
					class="mt-6"
				>
					Save this code somewhere safe now. It won't be shown again, and it replaces any previous
					recovery code. You can use it to sign in if you lose your authenticator.
				</RecoveryKeyCard>
			{/if}
			<form
				method="POST"
				action="?/disableTwoFactor"
				class="mt-6 space-y-5"
				use:enhance={twoFactorForm.submit}
			>
				<div class="grid gap-5 sm:grid-cols-2">
					<SettingsField
						label="Current password"
						id="disableTwoFactorPassword"
						name="currentPassword"
						type="password"
						required
						autocomplete="current-password"
					/>
					<SettingsField
						label="Authentication or recovery code"
						id="disableTwoFactorCode"
						name="code"
						type="text"
						required
						autocomplete="one-time-code"
						spellcheck="false"
						maxlength={32}
						class="font-mono tracking-widest"
					/>
				</div>

				<FormStatus large error={form?.twoFactorError} saved={form?.twoFactorSuccess} />

				<div>
					<SubmitButton
						pending={twoFactorForm.pending}
						label="Turn Off Two-Factor Authentication"
						pendingLabel="Turning off…"
						class="btn-secondary-lg"
					/>
				</div>
			</form>
		{:else if data.twoFactorSetup}
			<div class="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
				<img
					src={data.twoFactorSetup.qrCode}
					alt="QR code for setting up two-factor authentication"
					width="200"
					height="200"
					class="h-50 w-50 shrink-0 rounded-lg bg-white"
				/>
				<div class="space-y-3">
					<p class="text-base text-copy">
						1. Scan this QR code with your authenticator app. If you can't scan it, enter this key
						manually:
					</p>
					<p
						class="rounded-lg bg-code px-3 py-2 font-mono text-base font-semibold tracking-widest break-all text-heading"
					>
						{data.twoFactorSetup.secret}
					</p>
					<p class="text-base text-copy">2. Enter the 6-digit code the app shows to finish.</p>
				</div>
			</div>

			<form
				method="POST"
				action="?/confirmTwoFactor"
				class="mt-6 space-y-5"
				use:enhance={twoFactorForm.submit}
			>
				<SettingsField
					label="Authentication code"
					id="confirmTwoFactorCode"
					name="code"
					type="text"
					required
					inputmode="numeric"
					autocomplete="one-time-code"
					pattern={String.raw`\s*([0-9]\s*){6}`}
					maxlength={32}
					class="max-w-xs font-mono tracking-widest"
				/>

				<FormStatus large error={form?.twoFactorError} />

				<div class="flex flex-wrap items-center gap-3">
					<SubmitButton
						pending={twoFactorForm.pending}
						label="Turn On Two-Factor Authentication"
						pendingLabel="Verifying…"
						disabled={!data.twoFactorKeyConfigured}
						class="btn-primary-lg"
					/>
					<button
						type="submit"
						formaction="?/cancelTwoFactor"
						formnovalidate
						disabled={twoFactorForm.pending}
						class="btn-secondary-lg"
					>
						Cancel
					</button>
				</div>
			</form>
		{:else}
			<form
				method="POST"
				action="?/startTwoFactor"
				class="mt-6 space-y-5"
				use:enhance={twoFactorForm.submit}
			>
				<SettingsField
					label="Current password (required to set up two-factor authentication)"
					id="startTwoFactorPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
					class="max-w-md"
				/>

				<FormStatus large error={form?.twoFactorError} saved={form?.twoFactorSuccess} />

				<div>
					<SubmitButton
						pending={twoFactorForm.pending}
						label="Set Up Two-Factor Authentication"
						pendingLabel="Starting…"
						disabled={!data.twoFactorKeyConfigured}
						class="btn-primary-lg"
					/>
				</div>
			</form>
		{/if}
	</section>

	<!-- Emergency Recovery Code -->
	<section class="rounded-xl border border-form-border bg-page p-6 sm:p-8 shadow-sm">
		<h2 class="text-xl font-bold text-heading sm:text-2xl">Emergency Recovery Code</h2>
		<p class="mt-1.5 text-base text-muted">
			An emergency recovery code allows you to regain access to your admin account if you forget
			your password and cannot receive reset emails.
		</p>

		{#if form?.recoverySuccess && form.newRecoveryKey}
			<RecoveryKeyCard
				recoveryKey={form.newRecoveryKey}
				title="New Emergency Recovery Code"
				class="my-6"
			/>
			<p class="text-base font-medium text-success">
				New recovery code generated. Save it now: it won't be shown again, and previous recovery
				codes no longer work.
			</p>
		{/if}

		<form
			method="POST"
			action="?/rotateRecoveryKey"
			class="mt-6 space-y-5"
			use:enhance={recoveryForm.submit}
		>
			<SettingsField
				label="Current password (required to generate new code)"
				id="recoveryCurrentPassword"
				name="currentPassword"
				type="password"
				required
				autocomplete="current-password"
				class="max-w-md"
			/>

			{#if data.twoFactorEnabled}
				<SettingsField
					label="Authentication code (required because two-factor authentication is on)"
					id="recoveryTwoFactorCode"
					name="code"
					type="text"
					required
					inputmode="text"
					autocomplete="one-time-code"
					class="max-w-xs font-mono tracking-widest"
				/>
			{/if}

			<FormStatus large error={form?.recoveryError} />

			<div>
				<SubmitButton
					pending={recoveryForm.pending}
					label="Generate New Recovery Code"
					pendingLabel="Generating…"
					class="btn-secondary-lg"
				/>
			</div>
		</form>
	</section>
</div>
