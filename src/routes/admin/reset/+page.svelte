<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const resetForm = pendingForm();
</script>

<svelte:head>
	<title>Set New Password - Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-sm flex-col justify-center py-16">
	<h1 class="text-2xl font-bold tracking-tight text-heading">Set New Password</h1>
	<p class="mt-1 text-sm text-muted">Choose a new password for your admin account</p>

	{#if !data.valid}
		<div class="card mt-6 p-6">
			<p class="text-sm text-error">This password reset link is invalid or has expired.</p>
			<div class="mt-4">
				<a
					href={resolve('admin/forgot-password')}
					class="btn-primary inline-block w-full text-center"
				>
					Request New Reset Link
				</a>
			</div>
		</div>
	{:else}
		<form method="POST" class="mt-6 space-y-4" use:enhance={resetForm.submit}>
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
				pending={resetForm.pending}
				label="Update Password"
				pendingLabel="Updating password…"
				class="btn-primary w-full"
			/>
		</form>
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
