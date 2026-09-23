<script lang="ts">
	import { untrack, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type {
		ClassicEditor as ClassicEditorType,
		EditorConfig,
		FileLoader,
		UploadAdapter
	} from 'ckeditor5';
	import 'ckeditor5/ckeditor5.css';

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
	let editorInstance: ClassicEditorType | null = $state(null);
	let isReady = $state(false);
	let words = $state(0);
	let characters = $state(0);

	class CustomUploadAdapter implements UploadAdapter {
		private loader: FileLoader;

		constructor(loader: FileLoader) {
			this.loader = loader;
		}

		upload(): Promise<{ default: string }> {
			return this.loader.file.then(
				(file: File | null) =>
					new Promise((resolve, reject) => {
						if (!file) {
							reject('No file provided.');
							return;
						}
						const data = new FormData();
						data.append('file', file);
						fetch('/admin/upload', {
							method: 'POST',
							body: data
						})
							.then(async (res) => {
								const json = await res.json();
								if (!res.ok) {
									reject(json?.error || 'Upload failed.');
									return;
								}
								resolve({ default: json.path });
							})
							.catch((err) => {
								reject(err?.message || 'Upload failed.');
							});
					})
			);
		}

		abort() {
			// Abort handling if required
		}
	}

	onMount(() => {
		let isMounted = true;

		async function initCKEditor() {
			if (!hostElement || !browser) return;

			const {
				ClassicEditor,
				Alignment,
				Autoformat,
				AutoImage,
				AutoLink,
				Autosave,
				BlockQuote,
				Bold,
				Code,
				CodeBlock,
				Emoji,
				Essentials,
				FindAndReplace,
				GeneralHtmlSupport,
				Heading,
				Highlight,
				HorizontalLine,
				Image,
				ImageCaption,
				ImageInsert,
				ImageResize,
				ImageStyle,
				ImageToolbar,
				ImageUpload,
				Indent,
				IndentBlock,
				Italic,
				Link,
				LinkImage,
				List,
				ListProperties,
				MediaEmbed,
				Paragraph,
				PasteFromOffice,
				RemoveFormat,
				SelectAll,
				ShowBlocks,
				SourceEditing,
				SpecialCharacters,
				SpecialCharactersEssentials,
				Strikethrough,
				Subscript,
				Superscript,
				Table,
				TableCaption,
				TableCellProperties,
				TableColumnResize,
				TableProperties,
				TableToolbar,
				TodoList,
				Underline,
				WordCount
			} = await import('ckeditor5');

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			function CustomUploadAdapterPlugin(editor: any) {
				editor.plugins.get('FileRepository').createUploadAdapter = (loader: FileLoader) => {
					return new CustomUploadAdapter(loader);
				};
			}

			const config: EditorConfig = {
				licenseKey: 'GPL',
				placeholder,
				plugins: [
					Alignment,
					Autoformat,
					AutoImage,
					AutoLink,
					Autosave,
					BlockQuote,
					Bold,
					Code,
					CodeBlock,
					Emoji,
					Essentials,
					FindAndReplace,
					GeneralHtmlSupport,
					Heading,
					Highlight,
					HorizontalLine,
					Image,
					ImageCaption,
					ImageInsert,
					ImageResize,
					ImageStyle,
					ImageToolbar,
					ImageUpload,
					Indent,
					IndentBlock,
					Italic,
					Link,
					LinkImage,
					List,
					ListProperties,
					MediaEmbed,
					Paragraph,
					PasteFromOffice,
					RemoveFormat,
					SelectAll,
					ShowBlocks,
					SourceEditing,
					SpecialCharacters,
					SpecialCharactersEssentials,
					Strikethrough,
					Subscript,
					Superscript,
					Table,
					TableCaption,
					TableCellProperties,
					TableColumnResize,
					TableProperties,
					TableToolbar,
					TodoList,
					Underline,
					WordCount,
					CustomUploadAdapterPlugin
				],
				toolbar: {
					items: [
						'undo',
						'redo',
						'|',
						'sourceEditing',
						'showBlocks',
						'findAndReplace',
						'selectAll',
						'|',
						'heading',
						'|',
						'bold',
						'italic',
						'underline',
						'strikethrough',
						'subscript',
						'superscript',
						'code',
						'removeFormat',
						'|',
						'alignment',
						'|',
						'bulletedList',
						'numberedList',
						'todoList',
						'|',
						'outdent',
						'indent',
						'|',
						'link',
						'insertImage',
						'mediaEmbed',
						'insertTable',
						'blockQuote',
						'codeBlock',
						'horizontalLine',
						'specialCharacters',
						'emoji',
						'highlight'
					],
					shouldNotGroupWhenFull: true
				},
				heading: {
					options: [
						{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
						{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
						{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
						{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
					]
				},
				image: {
					toolbar: [
						'imageTextAlternative',
						'toggleImageCaption',
						'|',
						'imageStyle:inline',
						'imageStyle:wrapText',
						'imageStyle:breakText',
						'|',
						'resizeImage',
						'|',
						'linkImage'
					],
					insert: {
						integrations: ['upload', 'url']
					}
				},
				table: {
					contentToolbar: [
						'tableColumn',
						'tableRow',
						'mergeTableCells',
						'tableProperties',
						'tableCellProperties'
					]
				},
				htmlSupport: {
					allow: [
						{
							name: /.*/,
							attributes: true,
							classes: true,
							styles: true
						}
					]
				}
			};

			try {
				const editor = await ClassicEditor.create(hostElement, config);
				if (!isMounted) {
					await editor.destroy();
					return;
				}

				editorInstance = editor;
				isReady = true;

				if (value) {
					editor.setData(value);
				}

				editor.model.document.on('change:data', () => {
					const data = editor.getData();
					if (value !== data) {
						value = data;
					}
				});

				const wordCountPlugin = editor.plugins.get('WordCount');
				if (wordCountPlugin) {
					words = wordCountPlugin.words;
					characters = wordCountPlugin.characters;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					wordCountPlugin.on('update', (_evt: any, data: { words: number; characters: number }) => {
						words = data.words;
						characters = data.characters;
					});
				}
			} catch (err) {
				console.error('Failed to initialize CKEditor 5:', err);
			}
		}

		initCKEditor();

		return () => {
			isMounted = false;
			if (editorInstance) {
				editorInstance.destroy().catch((err) => {
					console.error('Error destroying CKEditor 5:', err);
				});
				editorInstance = null;
			}
		};
	});

	$effect(() => {
		if (editorInstance && isReady) {
			const currentData = editorInstance.getData();
			const targetData = untrack(() => value) || '';
			if (currentData !== targetData) {
				editorInstance.setData(targetData);
			}
		}
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

	<input type="hidden" {id} {name} value={value ?? ''} />
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
