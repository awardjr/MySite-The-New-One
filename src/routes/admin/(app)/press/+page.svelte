<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminHeading from '#lib/components/admin/AdminHeading.svelte';
	import ListEditor from '#lib/components/admin/ListEditor.svelte';
	import type { PressItem } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AdminHeading title="Press">
	Edit the headline, subtitle, and press mentions shown on the press page.
</AdminHeading>

<ListEditor
	field="items"
	items={data.items}
	headline={data.headline}
	subtitle={data.subtitle}
	headlinePlaceholder="Press"
	{form}
	reorderable={false}
	addLabel="+ Add Press Mention"
	newItem={(): PressItem => ({ outlet: '', title: '', summary: '', href: '', date: '' })}
	itemName={(item: PressItem) => item.title || 'this press mention'}
>
	{#snippet row(item: PressItem, controls: Snippet)}
		<div class="space-y-2 rounded-lg border border-form-border p-3">
			<input
				bind:value={item.outlet}
				placeholder="Outlet / Venue (e.g. The New York Times)"
				class="input-compact w-full"
			/>
			<input bind:value={item.title} placeholder="Piece title" class="input-compact w-full" />
			<textarea
				bind:value={item.summary}
				placeholder="Description"
				rows="3"
				class="input-compact w-full"></textarea>
			<input
				bind:value={item.href}
				placeholder="URL (e.g. https://...)"
				class="input-compact w-full"
			/>
			<input
				type="date"
				bind:value={item.date}
				placeholder="Date (optional)"
				class="input-compact w-full"
			/>

			{@render controls()}
		</div>
	{/snippet}
</ListEditor>
