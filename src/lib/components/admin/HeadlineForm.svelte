<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingForm } from '#lib/pendingForm.svelte.js';
	import { trackChanges } from '#lib/unsavedChanges.js';
	import FormRow from '#lib/components/admin/FormRow.svelte';
	import FormStatus from '#lib/components/admin/FormStatus.svelte';
	import SubmitButton from '#lib/components/admin/SubmitButton.svelte';

	let {
		headline: savedHeadline,
		subtitle: savedSubtitle,
		saved = false,
		headlineLabel = 'Page headline',
		headlinePlaceholder = '',
		hint,
		oninput
	}: {
		headline: string;
		subtitle?: string;
		saved?: boolean;
		headlineLabel?: string;
		headlinePlaceholder?: string;
		hint?: string;
		oninput?: () => void;
	} = $props();

	const hasSubtitle = untrack(() => savedSubtitle !== undefined);
	let headline = $state(untrack(() => savedHeadline));
	let subtitle = $state(untrack(() => savedSubtitle ?? ''));
	const saveForm = pendingForm({ reset: false });
	let showSaved = $derived(saved);

	function handleInput() {
		showSaved = false;
		oninput?.();
	}
</script>

<form
	method="POST"
	action="?/saveHeadline"
	class="mt-4 space-y-3 rounded-xl border border-form-border p-4"
	use:enhance={saveForm.submit}
	use:trackChanges
>
	<FormRow id="headline" label={headlineLabel} {hint}>
		<input
			id="headline"
			name="headline"
			bind:value={headline}
			oninput={handleInput}
			placeholder={headlinePlaceholder}
			class="input"
		/>
	</FormRow>

	{#if hasSubtitle}
		<FormRow id="subtitle" label="Page subtitle">
			<input
				id="subtitle"
				name="subtitle"
				bind:value={subtitle}
				oninput={handleInput}
				placeholder="Short description"
				class="input"
			/>
		</FormRow>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<SubmitButton pending={saveForm.pending} />
		<FormStatus saved={showSaved} />
	</div>
</form>
