<script lang="ts">
	import type { Snippet } from 'svelte';
	import Fa from 'svelte-fa';
	import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

	let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>

<span
	class={[
		'inline-flex items-center gap-1.5 text-sm font-semibold text-card-action transition-colors group-hover:text-card-heading',
		className
	]}
>
	{@render children()}
	<span class="transition-transform duration-200 motion-safe:group-hover:translate-x-1">
		<Fa icon={faArrowRight} class="h-3 w-3" />
	</span>
</span>
