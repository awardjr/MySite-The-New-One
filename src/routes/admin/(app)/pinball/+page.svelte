<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import HeadlineForm from '#lib/components/admin/HeadlineForm.svelte';
	import type { PageProps } from './$types';
	import type { PinballMachine } from '#lib/server/content.js';

	let { data, form }: PageProps = $props();

	let machines = $state<PinballMachine[]>(untrack(() => structuredClone(data.machines)));
	let saving = $state(false);
	let showSaved = $derived(!!(form && form.success));

	function clearSaved() {
		showSaved = false;
	}

	function addMachine() {
		machines.push({ name: '', image: '', highScore: '', modeScores: [] });
	}

	function removeMachine(index: number) {
		const machine = machines[index];
		if (!confirm(`Remove "${machine.name || 'this machine'}"?`)) return;
		machines.splice(index, 1);
	}

	function addModeScore(machine: PinballMachine) {
		machine.modeScores.push({ mode: '', score: '' });
	}

	function removeModeScore(machine: PinballMachine, index: number) {
		const modeScore = machine.modeScores[index];
		if (!confirm(`Remove mode score "${modeScore.mode || 'this mode score'}"?`)) return;
		machine.modeScores.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Admin - Pinball</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-heading">Pinball</h1>
<p class="mt-1 text-sm text-muted">
	Edit the headline, subtitle, and pinball machines shown on the pinball page.
</p>

<HeadlineForm
	headline={data.headline}
	subtitle={data.subtitle}
	saved={!!form?.headlineSuccess}
	headlinePlaceholder="Pinball"
	oninput={clearSaved}
/>

<form
	method="POST"
	action="?/save"
	class="mt-6 space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<input type="hidden" name="machines" value={JSON.stringify(machines)} />

	<div class="space-y-3">
		{#each machines as machine, i (i)}
			<div class="space-y-2 rounded-lg border border-form-border p-3">
				<input
					bind:value={machine.name}
					oninput={clearSaved}
					placeholder="Machine name"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<ImageUploadField
					label={null}
					placeholder="Image URL / path"
					bind:value={machine.image}
					onchange={clearSaved}
				/>
				<input
					bind:value={machine.highScore}
					oninput={clearSaved}
					placeholder="High score (e.g. 000,000,000)"
					class="w-full rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>

				<div class="space-y-2 rounded-lg border border-form-border-subtle p-2">
					<p class="text-xs font-medium text-form-hint">Mode Scores</p>
					{#each machine.modeScores as modeScore, j (j)}
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
							<input
								bind:value={modeScore.mode}
								oninput={clearSaved}
								placeholder="Mode (e.g. Mode A)"
								class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
							/>
							<input
								bind:value={modeScore.score}
								oninput={clearSaved}
								placeholder="Score (e.g. 000,000)"
								class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
							/>
							<button
								type="button"
								onclick={() => removeModeScore(machine, j)}
								class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover"
							>
								Remove
							</button>
						</div>
					{/each}
					<button
						type="button"
						onclick={() => addModeScore(machine)}
						class="rounded-lg border border-dashed border-field-border px-3 py-1.5 text-xs text-form-muted transition-colors hover:bg-secondary-hover"
					>
						+ Add Mode Score
					</button>
				</div>

				<button
					type="button"
					onclick={() => removeMachine(i)}
					class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover"
				>
					Remove Machine
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addMachine}
		class="rounded-lg border border-dashed border-field-border px-4 py-2 text-sm text-form-muted transition-colors hover:bg-secondary-hover"
	>
		+ Add Machine
	</button>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{:else if showSaved}
		<p in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="text-sm text-success">
			Saved.
		</p>
	{/if}

	<div>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-60"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>
