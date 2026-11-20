<script lang="ts">
	let { headline, subtitle }: { headline: string; subtitle: string } = $props();
</script>

<div class="space-y-1">
	<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{headline}</h1>
	{#if subtitle}
		<p class="text-lg text-muted">{subtitle}</p>
	{/if}
</div>
