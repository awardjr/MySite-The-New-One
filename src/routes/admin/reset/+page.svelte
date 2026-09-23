<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let resetting = $state(false);
</script>

<svelte:head>
	<title>Set New Password - Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Set New Password</h1>
	<p class="mt-1 text-sm text-muted">Choose a new password for your admin account</p>

	{#if !data.valid}
		<div class="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
			<p class="text-sm text-error">This password reset link is invalid or has expired.</p>
			<div class="mt-4">
				<a
					href={resolve('/admin/forgot-password')}
					class="inline-block w-full text-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover"
				>
					Request New Reset Link
				</a>
			</div>
		</div>
	{:else}
		<form
			method="POST"
			class="mt-6 space-y-4"
			use:enhance={() => {
				resetting = true;
				return async ({ update }) => {
					await update();
					resetting = false;
				};
			}}
		>
			<input type="hidden" name="token" value={data.token} />

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
				disabled={resetting}
				class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
			>
				{resetting ? 'Updating password…' : 'Update Password & Sign In'}
			</button>
		</form>
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
