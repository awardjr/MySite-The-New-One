<script lang="ts">
	import { onMount } from 'svelte';
	import type { ClassicEditor, WordCountUpdateEvent } from 'ckeditor5';
	import 'ckeditor5/ckeditor5.css';
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
			// The editor is large and needs a browser, so it only loads with this component.
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

<div class="space-y-1">
	{#if label}
		<label for={id} class="text-sm font-medium text-field-label">{label}</label>
	{/if}

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
</div>

<style>
	.ckeditor-wrapper,
	:global(.ck-body-wrapper) {
		--ck-color-base-background: var(--color-field);
		--ck-color-base-border: var(--color-field-border);
		--ck-color-toolbar-background: var(--color-field);
		--ck-color-toolbar-border: var(--color-field-border);
		--ck-color-text: var(--color-field-text);
		--ck-color-base-text: var(--color-field-text);
		--ck-color-button-default-hover-background: var(--color-secondary-hover);
		--ck-color-button-on-background: var(--color-secondary-hover);
		--ck-color-button-on-hover-background: var(--color-secondary-hover);
		--ck-color-editor-base-text: var(--color-field-text);
		--ck-color-editor-base-background: var(--color-field);
		--ck-color-dropdown-panel-background: var(--color-field);
		--ck-color-dropdown-panel-border: var(--color-field-border);
		--ck-color-list-background: var(--color-field);
		--ck-color-list-button-hover-background: var(--color-secondary-hover);
		--ck-color-panel-background: var(--color-field);
		--ck-color-panel-border: var(--color-field-border);
		--ck-color-input-background: var(--color-field);
		--ck-color-input-border: var(--color-field-border);
		--ck-color-input-text: var(--color-field-text);
		--ck-color-focus-border: var(--color-field-focus, var(--color-primary));
		--ck-color-shadow: transparent;
	}

	.ckeditor-wrapper :global(.ck.ck-editor) {
		width: 100%;
	}

	.ckeditor-wrapper :global(.ck.ck-toolbar) {
		border: none;
		border-bottom: 1px solid var(--color-field-border);
		background: var(--color-field);
		border-radius: 0;
	}

	.ckeditor-wrapper :global(.ck.ck-editor__editable_inline) {
		min-height: 18rem;
		padding: 1rem 1.25rem;
		background: var(--color-field);
		color: var(--color-field-text);
		border: none;
	}

	.ckeditor-wrapper :global(.ck.ck-editor__editable_inline:focus) {
		outline: none;
		border: none;
		box-shadow: none;
	}

	.ckeditor-wrapper :global(.ck.ck-dropdown__panel),
	:global(.ck-body-wrapper .ck.ck-dropdown__panel),
	:global(.ck-body-wrapper .ck.ck-balloon-panel) {
		background: var(--color-field);
		border-color: var(--color-field-border);
	}

	.ckeditor-wrapper :global(.ck.ck-list),
	:global(.ck-body-wrapper .ck.ck-list) {
		background: var(--color-field);
	}

	.ckeditor-wrapper :global(.ck.ck-button),
	:global(.ck-body-wrapper .ck.ck-button) {
		color: var(--color-field-text);
	}

	.ckeditor-wrapper :global(.ck.ck-button:hover),
	:global(.ck-body-wrapper .ck.ck-button:hover) {
		background: var(--color-secondary-hover);
	}
</style>
