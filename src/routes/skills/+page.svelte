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
		<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50 hotdog:text-yellow-300">
			Skills
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
			A categorized overview of the languages, tools, and technologies I work with.
		</p>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
		{#each skillCategories as { category, skills } (category)}
			<div
				class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 hotdog:border-black hotdog:bg-yellow-300"
			>
				<h2 class="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 hotdog:text-red-800">
					{category}
				</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each skills as skill (skill)}
						<span
							class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300 hotdog:bg-red-600 hotdog:text-yellow-200"
						>
							{skill}
						</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
