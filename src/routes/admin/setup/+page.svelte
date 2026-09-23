<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
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
	<title>Admin Setup</title>
</svelte:head>

<section class="mx-auto flex max-w-md flex-col justify-center py-16">
	{#if form?.success && form.recoveryKey}
		<div class="rounded-xl border border-card-border bg-card p-6 shadow-sm">
			<div class="mb-4 inline-flex items-center gap-2 text-success">
				<span class="inline-block h-2.5 w-2.5 rounded-full bg-success"></span>
				<h1 class="text-xl font-bold tracking-tight text-heading">Admin Account Created</h1>
			</div>

			<p class="text-sm text-copy">
				Your admin account has been configured with username <strong class="text-heading"
					>{form.username}</strong
				>
				and email <strong class="text-heading">{form.email}</strong>.
			</p>

			<div class="my-5 rounded-lg border border-card-border bg-page p-4">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-muted">
						Emergency Recovery Code
					</span>
					<button
						type="button"
						onclick={() => copyRecoveryKey(form?.recoveryKey ?? '')}
						class="text-xs font-medium text-muted hover:text-heading transition-colors"
					>
						{copied ? 'Copied!' : 'Copy code'}
					</button>
				</div>
				<p
					class="mt-2 font-mono text-lg font-bold tracking-wider text-heading selection:bg-nav-active"
				>
					{form.recoveryKey}
				</p>
			</div>

			<p class="text-xs leading-relaxed text-muted">
				Save this recovery code in a secure password manager. If you ever lose access to your
				password and email, this code is the only way to recover your admin account.
			</p>

			<div class="mt-6">
				<a
					href={resolve('/admin')}
					class="inline-block w-full text-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover"
				>
					Continue to Admin Dashboard
				</a>
			</div>
		</div>
	{:else}
		<h1 class="text-2xl font-bold tracking-tight text-heading">Create Admin Account</h1>
		<p class="mt-1 text-sm text-muted">
			Set up your admin credentials to manage and secure the <code
				class="rounded bg-code px-1 py-0.5 font-mono text-xs">/admin</code
			> site.
		</p>

		<form
			method="POST"
			class="mt-6 space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<div class="space-y-1">
				<label for="username" class="text-sm font-medium text-copy"> Username </label>
				<input
					id="username"
					name="username"
					type="text"
					required
					autocomplete="username"
					value={form?.username ?? ''}
					class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
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
					value={form?.email ?? ''}
					class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
				/>
			</div>

			<div class="space-y-1">
				<label for="password" class="text-sm font-medium text-copy"> Password </label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="8"
					autocomplete="new-password"
					class="w-full rounded-lg border border-field-border px-3 py-2 text-field-text-explicit focus:border-field-focus focus:outline-none bg-field"
				/>
			</div>

			<div class="space-y-1">
				<label for="confirmPassword" class="text-sm font-medium text-copy">
					Confirm password
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
				disabled={submitting}
				class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
			>
				{submitting ? 'Creating account…' : 'Create Account & Sign In'}
			</button>
		</form>
	{/if}
</section>
