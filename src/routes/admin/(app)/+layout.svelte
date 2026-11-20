<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { hasUnsavedChanges } from '#lib/unsavedChanges.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	beforeNavigate(({ cancel, type }) => {
		if (type === 'goto' || !hasUnsavedChanges()) return;
		if (type === 'leave' || !confirm('You have unsaved changes. Leave without saving?')) cancel();
	});
</script>

<div class="py-6 sm:py-10">
	{@render children()}
</div>
