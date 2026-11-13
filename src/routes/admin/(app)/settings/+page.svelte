<script lang="ts">
	import { enhance } from '$app/forms';
	import RecoveryKeyCard from '#lib/components/admin/RecoveryKeyCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingProfile = $state(false);
	let savingPassword = $state(false);
	let rotatingRecovery = $state(false);
	let savingTwoFactor = $state(false);

	const twoFactorSubmit = () => {
		savingTwoFactor = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			savingTwoFactor = false;
		};
	};
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

			<div class="grid gap-5 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="profileCurrentPassword" class="text-base font-medium text-field-label">
						Current password (required to change your profile)
					</label>
					<input
						id="profileCurrentPassword"
						name="currentPassword"
						type="password"
						required
						autocomplete="current-password"
						class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>

				{#if data.twoFactorEnabled}
					<div class="space-y-2">
						<label for="profileTwoFactorCode" class="text-base font-medium text-field-label">
							Authentication or recovery code
						</label>
						<input
							id="profileTwoFactorCode"
							name="code"
							type="text"
							required
							autocomplete="one-time-code"
							spellcheck="false"
							maxlength="32"
							class="w-full rounded-lg border border-field-border px-4 py-2.5 font-mono text-base tracking-widest bg-field text-field-text focus:outline-none"
						/>
					</div>
				{/if}
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
					<label for="newPassword" class="text-base font-medium text-field-label">
						New password
					</label>
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
				use:enhance={twoFactorSubmit}
			>
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="disableTwoFactorPassword" class="text-base font-medium text-field-label">
							Current password
						</label>
						<input
							id="disableTwoFactorPassword"
							name="currentPassword"
							type="password"
							required
							autocomplete="current-password"
							class="w-full rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
						/>
					</div>
					<div class="space-y-2">
						<label for="disableTwoFactorCode" class="text-base font-medium text-field-label">
							Authentication or recovery code
						</label>
						<input
							id="disableTwoFactorCode"
							name="code"
							type="text"
							required
							autocomplete="one-time-code"
							spellcheck="false"
							maxlength="32"
							class="w-full rounded-lg border border-field-border px-4 py-2.5 font-mono text-base tracking-widest bg-field text-field-text focus:outline-none"
						/>
					</div>
				</div>

				{#if form?.twoFactorError}
					<p class="text-base font-medium text-error">{form.twoFactorError}</p>
				{:else if form?.twoFactorSuccess}
					<p class="text-base font-medium text-success">{form.twoFactorSuccess}</p>
				{/if}

				<div>
					<button
						type="submit"
						disabled={savingTwoFactor}
						class="rounded-lg border border-field-border bg-field px-5 py-2.5 text-base font-semibold text-field-label transition-colors hover:bg-secondary-hover hover:text-heading disabled:opacity-60"
					>
						{savingTwoFactor ? 'Turning off…' : 'Turn Off Two-Factor Authentication'}
					</button>
				</div>
			</form>
		{:else if data.twoFactorSetup}
			<div class="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
				<img
					src={data.twoFactorSetup.qrCode}
					alt="QR code for setting up two-factor authentication"
					width="200"
					height="200"
					class="h-[200px] w-[200px] shrink-0 rounded-lg bg-white"
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
				use:enhance={twoFactorSubmit}
			>
				<div class="space-y-2">
					<label for="confirmTwoFactorCode" class="text-base font-medium text-field-label">
						Authentication code
					</label>
					<input
						id="confirmTwoFactorCode"
						name="code"
						type="text"
						required
						inputmode="numeric"
						autocomplete="one-time-code"
						pattern={String.raw`[0-9]{3}\s?[0-9]{3}`}
						maxlength="7"
						class="w-full max-w-xs rounded-lg border border-field-border px-4 py-2.5 font-mono text-base tracking-widest bg-field text-field-text focus:outline-none"
					/>
				</div>

				{#if form?.twoFactorError}
					<p class="text-base font-medium text-error">{form.twoFactorError}</p>
				{/if}

				<div class="flex flex-wrap items-center gap-3">
					<button
						type="submit"
						disabled={savingTwoFactor || !data.twoFactorKeyConfigured}
						class="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
					>
						{savingTwoFactor ? 'Verifying…' : 'Turn On Two-Factor Authentication'}
					</button>
					<button
						type="submit"
						formaction="?/cancelTwoFactor"
						formnovalidate
						disabled={savingTwoFactor}
						class="rounded-lg border border-field-border bg-field px-5 py-2.5 text-base font-semibold text-field-label transition-colors hover:bg-secondary-hover hover:text-heading disabled:opacity-60"
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
				use:enhance={twoFactorSubmit}
			>
				<div class="space-y-2">
					<label for="startTwoFactorPassword" class="text-base font-medium text-field-label">
						Current password (required to set up two-factor authentication)
					</label>
					<input
						id="startTwoFactorPassword"
						name="currentPassword"
						type="password"
						required
						autocomplete="current-password"
						class="w-full max-w-md rounded-lg border border-field-border px-4 py-2.5 text-base bg-field text-field-text focus:outline-none"
					/>
				</div>

				{#if form?.twoFactorError}
					<p class="text-base font-medium text-error">{form.twoFactorError}</p>
				{:else if form?.twoFactorSuccess}
					<p class="text-base font-medium text-success">{form.twoFactorSuccess}</p>
				{/if}

				{#if !data.hasRecoveryKey}
					<p class="text-base text-muted">
						Tip: generate an emergency recovery code below first, so you can still sign in if you
						lose your authenticator.
					</p>
				{/if}

				<div>
					<button
						type="submit"
						disabled={savingTwoFactor || !data.twoFactorKeyConfigured}
						class="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
					>
						{savingTwoFactor ? 'Starting…' : 'Set Up Two-Factor Authentication'}
					</button>
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

			{#if data.twoFactorEnabled}
				<div class="space-y-2">
					<label for="recoveryTwoFactorCode" class="text-base font-medium text-field-label">
						Authentication code (required because two-factor authentication is on)
					</label>
					<input
						id="recoveryTwoFactorCode"
						name="code"
						type="text"
						required
						inputmode="text"
						autocomplete="one-time-code"
						class="w-full max-w-xs rounded-lg border border-field-border px-4 py-2.5 font-mono text-base tracking-widest bg-field text-field-text focus:outline-none"
					/>
				</div>
			{/if}

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
