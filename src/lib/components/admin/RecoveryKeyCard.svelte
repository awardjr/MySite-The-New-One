<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		recoveryKey,
		title = 'Emergency Recovery Code',
		class: className = '',
		children
	}: {
		recoveryKey: string;
		title?: string;
		class?: string;
		/** Optional explanation shown under the code. */
		children?: Snippet;
	} = $props();

	let copied = $state(false);

	async function copyRecoveryKey() {
		try {
			await navigator.clipboard.writeText(recoveryKey);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Clipboard API not available
		}
	}
</script>

<div class="card p-5 {className}">
	<div class="flex items-center justify-between">
		<span class="text-sm font-bold uppercase tracking-wider text-card-meta">{title}</span>
		<button
			type="button"
			onclick={copyRecoveryKey}
			class="text-sm font-semibold text-card-action hover:text-card-heading transition-colors"
		>
			{copied ? 'Copied!' : 'Copy code'}
		</button>
	</div>
	<p
		class="mt-3 font-mono text-2xl font-bold tracking-widest text-card-heading selection:bg-nav-active"
	>
		{recoveryKey}
	</p>
	{#if children}
		<p class="mt-3 text-base text-card-copy">{@render children()}</p>
	{/if}
</div>
