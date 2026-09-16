<script lang="ts">
	import { untrack } from 'svelte';

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

	let editor: HTMLDivElement | undefined = $state();

	type ToolbarButton = {
		label: string;
		command: string;
		commandValue?: string;
		title: string;
	};

	const toolbarGroups: ToolbarButton[][] = [
		[
			{ label: 'B', command: 'bold', title: 'Bold' },
			{ label: 'I', command: 'italic', title: 'Italic' },
			{ label: 'U', command: 'underline', title: 'Underline' },
			{ label: 'S', command: 'strikeThrough', title: 'Strikethrough' }
		],
		[
			{ label: 'H2', command: 'formatBlock', commandValue: 'h2', title: 'Heading 2' },
			{ label: 'H3', command: 'formatBlock', commandValue: 'h3', title: 'Heading 3' },
			{ label: 'P', command: 'formatBlock', commandValue: 'p', title: 'Paragraph' }
		],
		[
			{ label: '•', command: 'insertUnorderedList', title: 'Bullet list' },
			{ label: '1.', command: 'insertOrderedList', title: 'Numbered list' },
			{ label: '❝', command: 'formatBlock', commandValue: 'blockquote', title: 'Quote' }
		],
		[{ label: 'Clear', command: 'removeFormat', title: 'Clear formatting' }]
	];

	function syncValue() {
		if (editor) value = editor.innerHTML;
	}

	function runCommand(button: ToolbarButton) {
		editor?.focus();
		document.execCommand(button.command, false, button.commandValue);
		syncValue();
	}

	function insertLink() {
		const url = window.prompt('Link URL');
		if (!url) return;
		editor?.focus();
		document.execCommand('createLink', false, url);
		syncValue();
	}

	$effect(() => {
		if (editor && editor.innerHTML !== untrack(() => value)) {
			// Syncing the contenteditable area's HTML directly is required; Svelte does not
			// otherwise manage this element's content.
			// eslint-disable-next-line svelte/no-dom-manipulating
			editor.innerHTML = untrack(() => value);
		}
	});
</script>

<div class="space-y-1">
	{#if label}
		<label for={id} class="text-sm font-medium text-field-label">{label}</label>
	{/if}

	<div
		class="overflow-hidden rounded-lg border border-field-border bg-field"
		role="group"
		aria-label={label ?? 'Rich text editor'}
	>
		<div class="flex flex-wrap gap-2 border-b border-field-border p-2">
			{#each toolbarGroups as group, groupIndex (groupIndex)}
				<div class="flex items-center gap-1 border-r border-field-border pr-2 last:border-r-0">
					{#each group as button (button.command + (button.commandValue ?? ''))}
						<button
							type="button"
							title={button.title}
							onclick={() => runCommand(button)}
							class="min-w-[2rem] rounded-md px-2 py-1 text-sm font-medium text-field-text transition-colors hover:bg-secondary-hover"
						>
							{button.label}
						</button>
					{/each}
				</div>
			{/each}
			<div class="flex items-center gap-1">
				<button
					type="button"
					title="Insert link"
					onclick={insertLink}
					class="min-w-[2rem] rounded-md px-2 py-1 text-sm font-medium text-field-text transition-colors hover:bg-secondary-hover"
				>
					🔗
				</button>
				<button
					type="button"
					title="Remove link"
					onclick={() => runCommand({ label: 'Unlink', command: 'unlink', title: 'Remove link' })}
					class="min-w-[2rem] rounded-md px-2 py-1 text-sm font-medium text-field-text transition-colors hover:bg-secondary-hover"
				>
					🔗✕
				</button>
			</div>
		</div>

		<div
			bind:this={editor}
			contenteditable="true"
			role="textbox"
			aria-multiline="true"
			aria-label={label ?? 'Content'}
			data-placeholder={placeholder}
			oninput={syncValue}
			onblur={syncValue}
			class="rich-text-editor min-h-[16rem] w-full px-3 py-2 text-sm text-field-text focus:outline-none"
		></div>
	</div>

	<input type="hidden" {id} {name} value={value ?? ''} />
</div>

<style>
	.rich-text-editor :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
	}

	.rich-text-editor :global(h3) {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0.75rem 0 0.5rem;
	}

	.rich-text-editor :global(p) {
		margin: 0.5rem 0;
	}

	.rich-text-editor :global(ul) {
		list-style: disc;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.rich-text-editor :global(ol) {
		list-style: decimal;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	.rich-text-editor :global(blockquote) {
		border-left: 3px solid var(--color-field-border);
		margin: 0.5rem 0;
		padding-left: 0.75rem;
		font-style: italic;
	}

	.rich-text-editor :global(a) {
		color: var(--color-link);
		text-decoration: underline;
	}

	.rich-text-editor:empty::before {
		content: attr(data-placeholder);
		color: var(--color-form-hint);
	}
</style>
