<script lang="ts">
	let {
		pending,
		label = 'Save changes',
		pendingLabel = 'Saving…',
		disabled,
		class: className = 'btn-primary'
	}: {
		pending: boolean;
		label?: string;
		pendingLabel?: string;
		disabled?: boolean;
		class?: string;
	} = $props();
</script>

<button type="submit" disabled={pending || disabled} class={['inline-grid', className]}>
	<span class={['col-start-1 row-start-1', pending && 'invisible']}>{label}</span>
	<span class={['col-start-1 row-start-1', !pending && 'invisible']}>{pendingLabel}</span>
</button>
