<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-[calc(100vh-8rem)] py-6 sm:py-10">
	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
</div>
