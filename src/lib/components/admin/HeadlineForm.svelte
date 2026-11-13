<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';

	/**
	 * The "page headline" editor shared by the admin pages. It posts to the page's
	 * `saveHeadline` action (see `saveHeadlineAction` in $lib/server/headlineAction.ts).
	 */
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
		/** Omit for pages that only have a headline. */
		subtitle?: string;
		/** Whether the last form submission saved the headline (`form?.headlineSuccess`). */
		saved?: boolean;
		headlineLabel?: string;
		headlinePlaceholder?: string;
		/** Optional help text under the headline field. */
		hint?: string;
		/** Called when either field is edited. */
		oninput?: () => void;
	} = $props();

	const hasSubtitle = untrack(() => savedSubtitle !== undefined);
	let headline = $state(untrack(() => savedHeadline));
	let subtitle = $state(untrack(() => savedSubtitle ?? ''));
	let saving = $state(false);
	// Follows `saved`, but hides again as soon as the fields are edited.
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
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<div class="space-y-1">
		<label for="headline" class="text-sm font-medium text-field-label">{headlineLabel}</label>
		<input
			id="headline"
			name="headline"
			bind:value={headline}
			oninput={handleInput}
			placeholder={headlinePlaceholder}
			class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
		/>
		{#if hint}
			<p class="text-xs text-form-hint">{hint}</p>
		{/if}
	</div>

	{#if hasSubtitle}
		<div class="space-y-1">
			<label for="subtitle" class="text-sm font-medium text-field-label">Page subtitle</label>
			<input
				id="subtitle"
				name="subtitle"
				bind:value={subtitle}
				oninput={handleInput}
				placeholder="Short description"
				class="w-full rounded-lg border border-field-border px-3 py-2 bg-field text-field-text"
			/>
		</div>
	{/if}

	<div>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>

{#if showSaved}
	<p in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="mt-2 text-sm text-success">
		Saved.
	</p>
{/if}
