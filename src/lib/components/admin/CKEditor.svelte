<script lang="ts">
	import FormRow from './FormRow.svelte';
	import { onMount, tick } from 'svelte';
	import type { ClassicEditor, WordCountUpdateEvent } from 'ckeditor5';
	import 'ckeditor5/ckeditor5.css';
	import { acceptCurrentValue } from '#lib/unsavedChanges.js';
	import { buildEditorConfig } from './ckeditorConfig';

	let {
		value = $bindable(''),
		label = 'Content',
		placeholder = 'Write your post…',
		id,
		name
	}: {
		value: string;
		label?: string | null;
		placeholder?: string;
		id?: string;
		name?: string;
	} = $props();

	let hostElement: HTMLDivElement | undefined = $state();
	let words = $state(0);
	let characters = $state(0);

	onMount(() => {
		let editor: ClassicEditor | undefined;
		let unmounted = false;

		async function startEditor(host: HTMLElement) {
			const ck = await import('ckeditor5');
			const created = await ck.ClassicEditor.create(
				buildEditorConfig(ck, { host, placeholder, compact: window.innerWidth < 768 })
			);
			if (unmounted) {
				await created.destroy();
				return;
			}

			editor = created;
			if (value) created.setData(value);
			created.model.document.on('change:data', () => {
				value = created.getData();
			});

			const wordCount = created.plugins.get('WordCount');
			words = wordCount.words;
			characters = wordCount.characters;
			wordCount.on<WordCountUpdateEvent>('update', (_event, data) => {
				words = data.words;
				characters = data.characters;
			});

			await tick();
			const form = host.closest('form');
			if (form && name) acceptCurrentValue(form, name);
		}

		if (hostElement) {
			startEditor(hostElement).catch((err) => {
				console.error('Failed to initialize CKEditor 5:', err);
			});
		}

		return () => {
			unmounted = true;
			editor?.destroy().catch((err) => {
				console.error('Error destroying CKEditor 5:', err);
			});
		};
	});
</script>

<FormRow {id} {label}>
	<div class="ckeditor-wrapper overflow-hidden rounded-lg border border-field-border bg-field">
		<div bind:this={hostElement}></div>
		<div
			class="flex justify-end gap-4 border-t border-field-border px-3 py-1.5 text-xs text-form-hint"
		>
			<span>Words: {words}</span>
			<span>Characters: {characters}</span>
		</div>
	</div>

	<input type="hidden" {id} {name} {value} />
</FormRow>

<style>
	:global(html:root) {
		--ck-color-base-background: var(--color-card);
		--ck-color-base-border: var(--color-card-border);
		--ck-color-base-text: var(--color-card-heading);
		--ck-color-focus-border: var(--color-field-focus);
		--ck-color-engine-placeholder-text: var(--color-form-hint);
		--ck-color-input-disabled-text: var(--color-card-meta);
		--ck-color-button-default-hover-background: var(--color-card-hover);
		--ck-color-button-default-active-background: var(--color-card-hover);
		--ck-color-button-on-background: var(--color-badge);
		--ck-color-button-on-hover-background: var(--color-badge);
		--ck-color-button-on-active-background: var(--color-badge);
		--ck-color-button-on-color: var(--color-badge-text);
		--ck-color-list-button-on-background: var(--color-badge);
		--ck-color-list-button-on-background-focus: var(--color-badge);
		--ck-color-list-button-on-text: var(--color-badge-text);
		--ck-color-button-action-text: white;
	}

	:global(.ck.ck-input::placeholder) {
		color: var(--color-card-meta);
	}

	.ckeditor-wrapper :global(.ck.ck-editor) {
		width: 100%;
	}

	.ckeditor-wrapper :global(.ck-editor__top .ck-sticky-panel__content) {
		border: none;
		border-bottom: 1px solid var(--color-field-border);
		border-radius: 0;
	}

	.ckeditor-wrapper :global(.ck.ck-editor__editable_inline) {
		min-height: 18rem;
		padding: 1rem 1.25rem;
		background: var(--color-field);
		color: var(--color-field-text-explicit);
		border: none;
	}

	.ckeditor-wrapper :global(.ck.ck-editor__editable_inline:focus) {
		outline: none;
		border: none;
		box-shadow: none;
	}
</style>
