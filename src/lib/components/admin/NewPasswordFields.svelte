<script lang="ts">
	import Field from './Field.svelte';

	/** A new password and its confirmation, posted as `name` and `confirmPassword`. */
	let {
		name = 'newPassword',
		label = 'New password',
		large = false
	}: { name?: string; label?: string; large?: boolean } = $props();
</script>

<Field
	id={name}
	{label}
	{large}
	type="password"
	required
	minlength={8}
	autocomplete="new-password"
/>
<Field
	id="confirmPassword"
	label="Confirm {label.toLowerCase()}"
	{large}
	type="password"
	required
	minlength={8}
	autocomplete="new-password"
/>
