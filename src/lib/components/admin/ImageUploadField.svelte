<script lang="ts">
	let {
		value = $bindable(''),
		label = 'Image',
		placeholder = '/uploads/my-image.jpg (uploaded) or a full URL',
		id,
		name
	}: {
		value: string;
		label?: string | null;
		placeholder?: string;
		id?: string;
		name?: string;
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
			const body = new FormData();
			body.append('file', file);
			const response = await fetch('/admin/upload', { method: 'POST', body });
			const result = await response.json();
			if (!response.ok) {
				error = result?.error ?? 'Upload failed.';
				return;
			}
			value = result.path;
		} catch {
			error = 'Upload failed.';
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<div class="space-y-1">
	{#if label}
		<label for={id} class="text-sm font-medium text-field-label">{label}</label>
	{/if}
	<input
		{id}
		{name}
		bind:value
		{placeholder}
		class="w-full rounded-lg border border-field-border px-3 py-2 text-sm bg-field text-field-text"
	/>

	<div class="flex flex-wrap items-center gap-3">
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
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
</div>
