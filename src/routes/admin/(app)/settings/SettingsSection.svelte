<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		badge,
		description,
		children
	}: { title: string; badge?: Snippet; description: Snippet; children: Snippet } = $props();
</script>

<section class="rounded-xl border border-form-border bg-page p-6 shadow-sm sm:p-8">
	<div class="flex flex-wrap items-center gap-3">
		<h2 class="text-xl font-bold text-heading sm:text-2xl">{title}</h2>
		{@render badge?.()}
	</div>
	<p class="mt-1.5 text-base text-muted">{@render description()}</p>
	{@render children()}
</section>
