<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { SkillCategory } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	let categories = $state<SkillCategory[]>(structuredClone(data.categories));
	let saving = $state(false);

	function addCategory() {
		categories.push({ category: '', skills: [] });
	}

	function removeCategory(index: number) {
		categories.splice(index, 1);
	}

	function skillsText(category: SkillCategory): string {
		return category.skills.join(', ');
	}

	function setSkillsText(category: SkillCategory, value: string) {
		category.skills = value
			.split(',')
			.map((skill) => skill.trim())
			.filter(Boolean);
	}
</script>

<svelte:head>
	<title>Admin - Skills</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 hotdog:text-yellow-300">Skills</h1>
<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
	Add, remove, or edit the skill categories shown on the skills page.
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
	<input type="hidden" name="categories" value={JSON.stringify(categories)} />

	<div class="space-y-3">
		{#each categories as category, i (i)}
			<div class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center dark:border-gray-800">
				<input
					bind:value={category.category}
					placeholder="Category name (e.g. Languages)"
					class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<input
					value={skillsText(category)}
					oninput={(e) => setSkillsText(category, e.currentTarget.value)}
					placeholder="Skills, comma-separated (e.g. HTML, CSS, JavaScript)"
					class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
				<button
					type="button"
					onclick={() => removeCategory(i)}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addCategory}
		class="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
	>
		+ Add Category
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
