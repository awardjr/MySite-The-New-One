<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { PinballMachine } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	let machines = $state<PinballMachine[]>(structuredClone(data.machines));
	let saving = $state(false);

	function addMachine() {
		machines.push({ name: '', image: '', highScore: '', modeScores: [] });
	}

	function removeMachine(index: number) {
		machines.splice(index, 1);
	}

	function addModeScore(machine: PinballMachine) {
		machine.modeScores.push({ mode: '', score: '' });
	}

	function removeModeScore(machine: PinballMachine, index: number) {
		machine.modeScores.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Admin - Pinball</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Pinball</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Add, remove, or edit the pinball machines shown on the pinball page.
</p>

<form
	method="POST"
	class="mt-6 max-w-2xl space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<input type="hidden" name="machines" value={JSON.stringify(machines)} />

	<div class="space-y-3">
		{#each machines as machine, i (i)}
			<div class="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
				<input
					bind:value={machine.name}
					placeholder="Machine name"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<input
					bind:value={machine.image}
					placeholder="Image URL / path"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<input
					bind:value={machine.highScore}
					placeholder="High score (e.g. 000,000,000)"
					class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>

				<div class="space-y-2 rounded-lg border border-gray-100 p-2 dark:border-gray-900">
					<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Mode Scores</p>
					{#each machine.modeScores as modeScore, j (j)}
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
							<input
								bind:value={modeScore.mode}
								placeholder="Mode (e.g. Mode A)"
								class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
							/>
							<input
								bind:value={modeScore.score}
								placeholder="Score (e.g. 000,000)"
								class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
							/>
							<button
								type="button"
								onclick={() => removeModeScore(machine, j)}
								class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
							>
								Remove
							</button>
						</div>
					{/each}
					<button
						type="button"
						onclick={() => addModeScore(machine)}
						class="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
					>
						+ Add Mode Score
					</button>
				</div>

				<button
					type="button"
					onclick={() => removeMachine(i)}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
				>
					Remove Machine
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addMachine}
		class="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
	>
		+ Add Machine
	</button>

	{#if form?.error}
		<p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-green-600 dark:text-green-400">Saved.</p>
	{/if}

	<div>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-gray-950 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-200 hotdog:bg-yellow-300 hotdog:text-black hotdog:hover:bg-yellow-200"
		>
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>
