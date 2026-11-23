import type { Editor, EditorConfig } from 'ckeditor5';
import { mediaProviders, playerAttributes, playerHtml } from '#lib/mediaEmbed.js';
import { uploadImage } from '#lib/uploadImage.js';

const compactToolbar =
	'undo redo | heading | bold italic | bulletedList numberedList | link insertImage mediaEmbed';
const fullToolbar =
	'undo redo | sourceEditing showBlocks findAndReplace selectAll | heading | ' +
	'bold italic underline strikethrough subscript superscript code removeFormat | alignment | ' +
	'bulletedList numberedList | outdent indent | link insertImage mediaEmbed insertTable blockQuote ' +
	'codeBlock horizontalLine highlight';
const imageToolbar =
	'imageTextAlternative toggleImageCaption | ' +
	'imageStyle:inline imageStyle:wrapText imageStyle:breakText | resizeImage | linkImage';

function uploadPlugin(editor: Editor) {
	editor.plugins.get('FileRepository').createUploadAdapter = (loader) => ({
		async upload() {
			const file = await loader.file;
			if (!file) throw new Error('No file provided.');
			try {
				return { default: await uploadImage(file) };
			} catch (err) {
				throw err instanceof Error ? err.message : 'Upload failed.';
			}
		}
	});
}

const BLUESKY_HANDLE_URL = /^(?:https?:\/\/)?(?:www\.)?bsky\.app\/profile\/([\w.-]+)\/post\/(\w+)/;
const didForHandle = new Map<string, Promise<string>>();

function resolveBlueskyHandle(handle: string): Promise<string> {
	let did = didForHandle.get(handle);
	if (!did) {
		did = fetch(
			`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
		)
			.then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
			.then(({ did }: { did?: unknown }) => {
				if (typeof did !== 'string' || !did.startsWith('did:')) throw new Error('No DID returned');
				return did;
			});
		did.catch(() => didForHandle.delete(handle));
		didForHandle.set(handle, did);
	}
	return did;
}

function blueskyDidPlugin(editor: Editor) {
	const { model } = editor;
	model.document.on('change:data', () => {
		for (const change of model.document.differ.getChanges()) {
			const range =
				change.type === 'insert'
					? model.createRange(change.position, change.position.getShiftedBy(change.length))
					: change.type === 'attribute' && change.attributeKey === 'url'
						? change.range
						: null;
			for (const item of range?.getItems() ?? []) {
				if (!item.is('element', 'media')) continue;
				const url = item.getAttribute('url');
				const match = typeof url === 'string' ? url.match(BLUESKY_HANDLE_URL) : null;
				if (!match) continue;
				const [, handle, rkey] = match;
				resolveBlueskyHandle(handle).then(
					(did) => {
						if (!item.isAttached() || item.getAttribute('url') !== url) return;
						model.enqueueChange({ isUndoable: false }, (writer) => {
							writer.setAttribute('url', `https://bsky.app/profile/${did}/post/${rkey}`, item);
						});
					},
					(err) => console.error(`Could not look up the Bluesky account ${handle}:`, err)
				);
			}
		}
	});
}

export function buildEditorConfig(
	ck: typeof import('ckeditor5'),
	{ host, placeholder, compact }: { host: HTMLElement; placeholder: string; compact: boolean }
): EditorConfig {
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
		ck.MediaEmbed,
		blueskyDidPlugin,
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
		mediaEmbed: {
			providers: [
				...mediaProviders.map((provider) => ({
					name: provider.name,
					url: provider.url,
					html: (match: RegExpMatchArray) =>
						playerHtml(playerAttributes(provider, match, location.hostname))
				})),
				{ name: 'Bluesky', url: BLUESKY_HANDLE_URL }
			]
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
		},
		htmlSupport: {
			allow: [{ name: /.*/, classes: true }]
		}
	};
}
