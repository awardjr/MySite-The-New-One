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

	let { data, form }: PageProps = $props();

	const setupForm = pendingForm({
		refreshAll: () => false
	});
</script>

<svelte:head>
	<title>Admin Setup</title>
</svelte:head>

<section class="mx-auto flex max-w-md flex-col justify-center py-16">
	{#if form?.success && form.recoveryKey}
		<h1 class="text-2xl font-bold tracking-tight text-heading">Admin Account Created</h1>
		<p class="mt-1 text-sm text-copy">
			Your admin account has been configured with username
			<strong class="text-heading">{form.username}</strong>
			and email <strong class="text-heading">{form.email}</strong>.
		</p>

		<RecoveryKeyCard recoveryKey={form.recoveryKey} class="mt-6">
			Save this recovery code in a secure password manager. If you ever lose access to your password
			and email, this code is the only way to recover your admin account.
		</RecoveryKeyCard>

		<a href={resolve('admin')} class="btn-primary mt-6 inline-block w-full text-center">
			Continue to Admin Dashboard
		</a>
	{:else}
		<h1 class="text-2xl font-bold tracking-tight text-heading">Create Admin Account</h1>
		<p class="mt-1 text-sm text-muted">
			Set up your admin credentials to manage and secure the <code
				class="rounded bg-code px-1 py-0.5 font-mono text-xs">/admin</code
			> site.
		</p>

		<form method="POST" class="mt-6 space-y-4" use:enhance={setupForm.submit}>
			{#if data.setupTokenRequired}
				<Field id="setupToken" label="Setup token" type="password" required autocomplete="off">
					The value of <code class="rounded bg-code px-1 py-0.5 font-mono">SETUP_TOKEN</code> in the server
					environment.
				</Field>
			{/if}
			<Field
				id="username"
				label="Username"
				required
				autocomplete="username"
				value={form?.username ?? ''}
			/>
			<Field
				id="email"
				label="Email address"
				type="email"
				required
				autocomplete="email"
				value={form?.email ?? ''}
			/>
			<NewPasswordFields name="password" label="Password" />
			<FormStatus error={form?.error} />
			<SubmitButton
				pending={setupForm.pending}
				label="Create Account & Sign In"
				pendingLabel="Creating account…"
				class="btn-primary w-full"
			/>
		</form>
	{/if}
</section>
