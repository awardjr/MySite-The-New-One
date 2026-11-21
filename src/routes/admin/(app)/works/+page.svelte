<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminHeading from '#lib/components/admin/AdminHeading.svelte';
	import ListEditor from '#lib/components/admin/ListEditor.svelte';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import { platforms } from '#lib/platforms.js';
	import type { WorkItem } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function togglePlatform(item: WorkItem, key: string, checked: boolean) {
		const others = item.platforms.filter((platform) => platform !== key);
		item.platforms = checked ? [...others, key] : others;
	}
</script>

<AdminHeading title="Works">
	Edit the headline, subtitle, and works shown on the works page.
</AdminHeading>

<ListEditor
	field="items"
	items={data.items}
	headline={data.headline}
	subtitle={data.subtitle}
	headlinePlaceholder="Works"
	{form}
	addLabel="+ Add Work"
	newItem={(): WorkItem => ({
		id: '',
		title: '',
		description: '',
		image: '',
		link: '',
		platforms: []
	})}
	itemName={(item: WorkItem) => item.title || 'this work'}
>
	{#snippet row(item: WorkItem, controls: Snippet)}
		<div class="space-y-2 rounded-lg border border-form-border p-3">
			<input bind:value={item.title} placeholder="Title" class="input-compact w-full" />
			<textarea
				bind:value={item.description}
				placeholder="Description"
				rows="3"
				class="input-compact w-full"></textarea>
			<input
				bind:value={item.link}
				placeholder="Link URL (optional)"
				type="url"
				class="input-compact w-full"
			/>
			<ImageUploadField label={null} placeholder="Image URL / path" bind:value={item.image} />

			<div class="flex flex-wrap gap-3 pt-1">
				{#each platforms as platform (platform.key)}
					<label class="flex items-center gap-1.5 text-sm text-field-label">
						<input
							type="checkbox"
							checked={item.platforms.includes(platform.key)}
							onchange={(e) => togglePlatform(item, platform.key, e.currentTarget.checked)}
							class="rounded border-field-border"
						/>
						{platform.label}
					</label>
				{/each}
			</div>

			{@render controls()}
		</div>
	{/snippet}
</ListEditor>
