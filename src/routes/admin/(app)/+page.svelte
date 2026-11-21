<script lang="ts">
	import { adminSections } from '#lib/adminSections.js';
	import AdminHeading from '#lib/components/admin/AdminHeading.svelte';
</script>

<AdminHeading title="Dashboard">
	Pick a section below to edit its content. Changes are saved immediately and go live right away.
</AdminHeading>

<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each adminSections as section (section.href)}
		<a href={section.href} class="card card-interactive block p-4">
			<h2 class="font-semibold text-card-heading">{section.label}</h2>
			<p class="mt-1 text-sm text-card-copy">{section.description}</p>
		</a>
	{/each}
</div>
