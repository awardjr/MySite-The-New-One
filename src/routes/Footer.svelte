<script lang="ts">
	import { resolve } from '$app/paths';

	let { siteName = '' }: { siteName?: string } = $props();
	const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-chrome-border bg-footer">
	<div
		class="mx-auto flex max-w-7/10 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-6 text-subtle max-sm:max-w-none sm:justify-end sm:px-6"
	>
		<a href={resolve('privacy')} class="transition-colors hover:text-heading hover:underline">
			Privacy
		</a>
		<p>© {year}{siteName ? ` ${siteName}` : ''}</p>
	</div>
</footer>
