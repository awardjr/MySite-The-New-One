<script lang="ts">
	let { codes, class: className = '' }: { codes: string[]; class?: string } = $props();

	let copied = $state(false);

	async function copyCodes() {
		try {
			await navigator.clipboard.writeText(codes.join('\n'));
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			copied = false;
		}
	}
</script>

<div class="card p-5 {className}">
	<div class="flex items-center justify-between">
		<span class="text-sm font-bold uppercase tracking-wider text-card-meta">Backup Codes</span>
		<button
			type="button"
			onclick={copyCodes}
			class="text-sm font-semibold text-card-action hover:text-card-heading transition-colors"
		>
			{copied ? 'Copied!' : 'Copy codes'}
		</button>
	</div>
	<ul class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-lg font-bold text-card-heading">
		{#each codes as code (code)}
			<li class="selection:bg-nav-active">{code}</li>
		{/each}
	</ul>
	<p class="mt-3 text-base text-card-copy">
		Save these somewhere safe now. They won't be shown again. Each one signs you in once if you lose
		your authenticator, and they replace any codes you had before.
	</p>
</div>
