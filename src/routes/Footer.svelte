<script lang="ts">
	let { siteName = '' }: { siteName?: string } = $props();
	const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-chrome-border bg-footer">
	<div class="mx-auto flex max-w-7/10 justify-end-safe px-4 py-6 text-subtle sm:px-6">
		<p>© {year}{siteName ? ` ${siteName}` : ''}</p>
	</div>
</footer>
