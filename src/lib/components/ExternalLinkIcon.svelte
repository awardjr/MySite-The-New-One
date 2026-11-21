<script lang="ts">
	import Fa from 'svelte-fa';
	import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

	let { href, class: className }: { href: string; class?: string } = $props();
</script>

<span
	title={href}
	class={['absolute text-card-action transition-colors group-hover:text-card-heading', className]}
>
	<Fa icon={faArrowUpRightFromSquare} class="h-4 w-4" />
</span>
