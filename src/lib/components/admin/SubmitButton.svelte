<script lang="ts">
	let {
		pending,
		label = 'Save changes',
		pendingLabel = 'Saving…',
		disabled,
		class: className = 'btn-primary'
	}: {
		/** Whether the form is being submitted (see `pendingForm`). */
		pending: boolean;
		label?: string;
		pendingLabel?: string;
		/** Disables the button for reasons other than a submit in progress. */
		disabled?: boolean;
		class?: string;
	} = $props();
</script>

<!-- Both labels share one grid cell, so the button keeps the width of the longer one instead of
     resizing while the form is sent. Only the visible one is read out. -->
<button type="submit" disabled={pending || disabled} class={['inline-grid', className]}>
	<span class={['col-start-1 row-start-1', pending && 'invisible']}>{label}</span>
	<span class={['col-start-1 row-start-1', !pending && 'invisible']}>{pendingLabel}</span>
</button>
