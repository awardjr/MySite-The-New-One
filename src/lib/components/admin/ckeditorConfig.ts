import type { Editor, EditorConfig } from 'ckeditor5';
import { uploadImage } from '#lib/uploadImage.js';

// Toolbar buttons in order; `|` separates groups.
const compactToolbar =
	'undo redo | heading | bold italic | bulletedList numberedList | link insertImage';
const fullToolbar =
	'undo redo | sourceEditing showBlocks findAndReplace selectAll | heading | ' +
	'bold italic underline strikethrough subscript superscript code removeFormat | alignment | ' +
	'bulletedList numberedList | outdent indent | link insertImage insertTable blockQuote ' +
	'codeBlock horizontalLine specialCharacters emoji highlight';
const imageToolbar =
	'imageTextAlternative toggleImageCaption | ' +
	'imageStyle:inline imageStyle:wrapText imageStyle:breakText | resizeImage | linkImage';

/** Sends images added in the editor through the site's own upload endpoint. */
function uploadPlugin(editor: Editor) {
	editor.plugins.get('FileRepository').createUploadAdapter = (loader) => ({
		async upload() {
			const file = await loader.file;
			if (!file) throw new Error('No file provided.');
			try {
				return { default: await uploadImage(file) };
			} catch (err) {
				// CKEditor shows the rejection value itself as the warning, so it must be a string.
				throw err instanceof Error ? err.message : 'Upload failed.';
			}
		}
	});
}

/** Builds the editor's settings. `compact` gives phones a smaller feature set and toolbar. */
export function buildEditorConfig(
	ck: typeof import('ckeditor5'),
	{ host, placeholder, compact }: { host: HTMLElement; placeholder: string; compact: boolean }
): EditorConfig {
	// Only features whose output survives `sanitizePostHtml` on save belong here: anything
	// else would look fine in the editor and then silently disappear from the saved post.
	const compactPlugins = [
		ck.Autoformat,
		ck.Bold,
		ck.Essentials,
		ck.GeneralHtmlSupport,
		ck.Heading,
		ck.Image,
		ck.ImageInsert,
		ck.ImageUpload,
		ck.Italic,
		ck.Link,
		ck.List,
		ck.Paragraph,
		ck.RemoveFormat,
		ck.WordCount,
		uploadPlugin
	];
	const fullPlugins = [
		...compactPlugins,
		ck.Alignment,
		ck.AutoImage,
		ck.AutoLink,
		ck.BlockQuote,
		ck.Code,
		ck.CodeBlock,
		ck.Emoji,
		ck.FindAndReplace,
		ck.Highlight,
		ck.HorizontalLine,
		ck.ImageCaption,
		ck.ImageResize,
		ck.ImageStyle,
		ck.ImageToolbar,
		ck.Indent,
		ck.IndentBlock,
		ck.LinkImage,
		ck.ListProperties,
		ck.PasteFromOffice,
		ck.SelectAll,
		ck.ShowBlocks,
		ck.SourceEditing,
		ck.SpecialCharacters,
		ck.SpecialCharactersEssentials,
		ck.Strikethrough,
		ck.Subscript,
		ck.Superscript,
		ck.Table,
		ck.TableCaption,
		ck.TableColumnResize,
		ck.TableToolbar,
		ck.Underline
	];

	return {
		licenseKey: 'GPL',
		attachTo: host,
		root: { placeholder },
		plugins: compact ? compactPlugins : fullPlugins,
		toolbar: {
			items: (compact ? compactToolbar : fullToolbar).split(' '),
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
			toolbar: imageToolbar.split(' '),
			insert: {
				integrations: ['upload', 'url']
			}
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
		},
		// Keep class names on any element (the sanitizer does too). Arbitrary attributes and
		// inline styles are not preserved, because the sanitizer strips them on save.
		htmlSupport: {
			allow: [{ name: /.*/, classes: true }]
		}
	};
}
