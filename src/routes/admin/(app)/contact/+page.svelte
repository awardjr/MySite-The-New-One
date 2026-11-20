<script lang="ts">
	import type { Snippet } from 'svelte';
	import ListEditor from '#lib/components/admin/ListEditor.svelte';
	import { iconOptions } from '#lib/icons.js';
	import type { ContactLink } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin - Contact</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Contact Links</h1>
<p class="mt-1 text-sm text-muted">
	Edit the headline, subtitle, and links shown on the contact page.
</p>

<ListEditor
	field="links"
	items={data.links}
	headline={data.headline}
	subtitle={data.subtitle}
	headlinePlaceholder="Contact"
	{form}
	addLabel="+ Add Link"
	newItem={(): ContactLink => ({ label: '', href: 'https://', icon: 'link', description: '' })}
	itemName={(link: ContactLink) => link.label || 'this link'}
>
	{#snippet row(link: ContactLink, controls: Snippet)}
		<div
			class="grid grid-cols-1 gap-2 rounded-lg border border-form-border p-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center"
		>
			<input bind:value={link.label} placeholder="Label (e.g. LinkedIn)" class="input-compact" />
			<input
				bind:value={link.href}
				placeholder="URL (e.g. https://... or mailto:you@example.com)"
				class="input-compact"
			/>
			<select bind:value={link.icon} class="input-compact">
				{#each iconOptions as iconKey (iconKey)}
					<option value={iconKey}>{iconKey}</option>
				{/each}
			</select>
			{@render controls()}
			<textarea
				bind:value={link.description}
				placeholder="Description shown on hover"
				rows="2"
				class="input-compact col-span-full"></textarea>
		</div>
	{/snippet}
</ListEditor>
