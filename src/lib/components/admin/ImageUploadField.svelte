<script lang="ts">
	import FormRow from './FormRow.svelte';
	import { UPLOAD_IMAGE_TYPES } from '#lib/imageTypes.js';
	import { uploadImage } from '#lib/uploadImage.js';

	let {
		value = $bindable(''),
		label = 'Image',
		placeholder = '/uploads/my-image.jpg (uploaded) or a full URL',
		id,
		name,
		onchange
	}: {
		value: string;
		label?: string | null;
		placeholder?: string;
		id?: string;
		name?: string;
		onchange?: () => void;
	} = $props();

	let uploading = $state(false);
	let error = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		error = '';
		try {
			value = await uploadImage(file);
			onchange?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed.';
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<FormRow {id} {label}>
	<input {id} {name} bind:value oninput={() => onchange?.()} {placeholder} class="input text-sm" />

	<div class="flex flex-wrap items-center gap-3">
		<input
			bind:this={fileInput}
			type="file"
			accept={Object.keys(UPLOAD_IMAGE_TYPES).join(',')}
			onchange={handleFileChange}
			class="text-xs text-form-muted file:mr-3 file:rounded-lg file:border-0 file:bg-file-button file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-file-button-text hover:file:bg-file-button-hover"
		/>
		{#if uploading}
			<span class="text-xs text-form-hint">Uploading…</span>
		{/if}
	</div>

	{#if error}
		<p class="text-xs text-error">{error}</p>
	{/if}

	{#if value}
		<img
			src={value}
			alt="Preview"
			class="mt-1 h-20 w-20 rounded-lg border border-form-border object-cover"
		/>
	{/if}
</FormRow>
