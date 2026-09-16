<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { SkillCategory } from '$lib/server/content';

	let { data, form }: PageProps = $props();

	// svelte-ignore state_referenced_locally
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

<h1 class="text-2xl font-bold tracking-tight text-heading">Skills</h1>
<p class="mt-1 text-sm text-muted">
	Add, remove, or edit the skill categories shown on the skills page.
</p>

<form
	method="POST"
	class="mt-6 max-w-2xl space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<input type="hidden" name="categories" value={JSON.stringify(categories)} />

	<div class="space-y-3">
		{#each categories as category, i (i)}
			<div
				class="grid grid-cols-1 gap-2 rounded-lg border border-form-border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center"
			>
				<input
					bind:value={category.category}
					placeholder="Category name (e.g. Languages)"
					class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<input
					value={skillsText(category)}
					oninput={(e) => setSkillsText(category, e.currentTarget.value)}
					placeholder="Skills, comma-separated (e.g. HTML, CSS, JavaScript)"
					class="rounded-lg border border-field-border px-2 py-1.5 text-sm bg-field text-field-text"
				/>
				<button
					type="button"
					onclick={() => removeCategory(i)}
					class="rounded-lg border border-field-border px-3 py-1.5 text-sm text-danger-text transition-colors hover:bg-danger-hover"
				>
					Remove
				</button>
			</div>
		{/each}
	</div>

	<button
		type="button"
		onclick={addCategory}
		class="rounded-lg border border-dashed border-field-border px-4 py-2 text-sm text-form-muted transition-colors hover:bg-secondary-hover"
	>
		+ Add Category
	</button>

	{#if form?.error}
		<p class="text-sm text-error">{form.error}</p>
	{:else if form?.success}
		<p class="text-sm text-success">Saved.</p>
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
