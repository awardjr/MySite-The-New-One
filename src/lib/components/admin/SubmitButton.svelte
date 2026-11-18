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

<button type="submit" disabled={pending || disabled} class={className}>
	{pending ? pendingLabel : label}
</button>
