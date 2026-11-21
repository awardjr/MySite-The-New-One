<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import NewPasswordFields from '#lib/components/admin/NewPasswordFields.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';
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
			<a
				href={resolve('admin/forgot-password')}
				class="btn-primary mt-4 inline-block w-full text-center"
			>
				Request New Reset Link
			</a>
		</div>
	{:else}
		<form method="POST" class="mt-6 space-y-4" use:enhance={resetForm.submit}>
			<input type="hidden" name="token" value={data.token} />
			<NewPasswordFields />
			<FormStatus error={form?.error} />
			<SubmitButton
				pending={resetForm.pending}
				label="Update Password"
				pendingLabel="Updating password…"
				class="btn-primary w-full"
			/>
		</form>
	{/if}

	<a
		href={resolve('admin/login')}
		class="mx-auto mt-6 text-xs text-muted transition-colors hover:text-heading hover:underline"
	>
		← Return to Login
	</a>
</section>
