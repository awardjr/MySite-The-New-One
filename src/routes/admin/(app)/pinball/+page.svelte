<script lang="ts">
	import ListEditor from '#lib/components/admin/ListEditor.svelte';
	import ImageUploadField from '#lib/components/admin/ImageUploadField.svelte';
	import type { PinballMachine } from '#lib/server/content.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

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

<ListEditor
	field="machines"
	items={data.machines}
	headline={data.headline}
	subtitle={data.subtitle}
	headlinePlaceholder="Pinball"
	{form}
	addLabel="+ Add Machine"
	newItem={(): PinballMachine => ({ name: '', image: '', highScore: '', modeScores: [] })}
	itemName={(machine: PinballMachine) => machine.name || 'this machine'}
>
	{#snippet row(machine: PinballMachine, remove: () => void)}
		<div class="space-y-2 rounded-lg border border-form-border p-3">
			<input bind:value={machine.name} placeholder="Machine name" class="input-compact w-full" />
			<ImageUploadField label={null} placeholder="Image URL / path" bind:value={machine.image} />
			<input
				bind:value={machine.highScore}
				placeholder="High score (e.g. 000,000,000)"
				class="input-compact w-full"
			/>

			<div class="space-y-2 rounded-lg border border-form-border-subtle p-2">
				<p class="text-xs font-medium text-form-hint">Mode Scores</p>
				{#each machine.modeScores as modeScore, j (j)}
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
						<input
							bind:value={modeScore.mode}
							placeholder="Mode (e.g. Mode A)"
							class="input-compact"
						/>
						<input
							bind:value={modeScore.score}
							placeholder="Score (e.g. 000,000)"
							class="input-compact"
						/>
						<button type="button" onclick={() => removeModeScore(machine, j)} class="btn-remove">
							Remove
						</button>
					</div>
				{/each}
				<button
					type="button"
					onclick={() => addModeScore(machine)}
					class="btn-add px-3 py-1.5 text-xs"
				>
					+ Add Mode Score
				</button>
			</div>

			<button type="button" onclick={remove} class="btn-remove"> Remove Machine </button>
		</div>
	{/snippet}
</ListEditor>
