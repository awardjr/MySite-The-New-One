<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { skillCategories } = $derived(data);
</script>

<svelte:head>
	<title>Skills - Arthur Ward Jr</title>
	<meta name="description" content="Skills - Arthur Ward Jr" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight text-heading sm:text-4xl">Skills</h1>
		<p class="text-base text-muted">
			A categorized overview of the languages, tools, and technologies I work with.
		</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
		{#each skillCategories as { category, skills } (category)}
			<div class="rounded-xl border border-card-border bg-card p-5 shadow-sm">
				<h2 class="text-sm font-semibold tracking-wide text-score-label uppercase">
					{category}
				</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each skills as skill (skill)}
						<span class="rounded-full bg-badge px-3 py-1 text-sm font-medium text-badge-text">
							{skill}
						</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
