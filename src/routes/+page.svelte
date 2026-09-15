<script lang="ts">
	import { openLightbox } from '$lib/lightbox.svelte';

	// Set your photo URL or path (e.g. '/profile.jpg' in the static/ folder)
	const photoSrc = '';
	const name = 'Arthur Ward Jr';
</script>

<svelte:head>
	<title>Home - Arthur Ward Jr</title>
	<meta name="description" content="Arthur Ward Jr - Personal Homepage" />
</svelte:head>

<section class="py-6 sm:py-10">
	<div class="flex flex-col-reverse items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
		<!-- Text Introduction Section -->
		<div class="flex-1 space-y-4 text-center md:text-left">
			<div class="space-y-1">
				<p class="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 hotdog:text-yellow-200">
					Welcome
				</p>
				<h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl dark:text-gray-50 hotdog:text-yellow-300">
					Hi, I'm {name}
				</h1>
			</div>

			<p class="text-lg font-medium text-gray-700 sm:text-xl dark:text-gray-300 hotdog:text-yellow-100">
				Developer, creator, and builder.
			</p>

			<div class="space-y-3 text-base leading-relaxed text-gray-600 dark:text-gray-400 hotdog:text-yellow-100">
				<p>
					Welcome to my website! This is where I share my work, skills, side projects, and thoughts.
					Feel free to customize this intro with details about your background, current projects, or areas of expertise.
				</p>
				<p>
					Explore the sections above to see recent works and press mentions, or head over to the contact page to get in touch.
				</p>
			</div>
		</div>

		<!-- Photo Section -->
		<div class="flex shrink-0 justify-center">
			{#if photoSrc}
				<img
					src={photoSrc}
					alt={name}
					onclick={() => openLightbox(photoSrc, name)}
					onkeydown={(e) => e.key === 'Enter' && openLightbox(photoSrc, name)}
					tabindex="0"
					class="h-56 w-56 cursor-pointer rounded-2xl object-cover shadow-md ring-1 ring-gray-200 sm:h-72 sm:w-72 dark:ring-gray-800 hotdog:ring-yellow-400"
				/>
			{:else}
				<div
					class="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center text-gray-400 sm:h-72 sm:w-72 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 hotdog:border-yellow-400 hotdog:bg-red-700 hotdog:text-yellow-200"
				>
					<div
						class="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600 sm:h-24 sm:w-24 sm:text-3xl dark:bg-gray-800 dark:text-gray-300 hotdog:bg-yellow-300 hotdog:text-red-700"
					>
						AW
					</div>
					<span class="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 hotdog:text-yellow-200">
						Set <code class="rounded bg-gray-200 px-1 py-0.5 font-mono text-[11px] dark:bg-gray-800 hotdog:bg-red-800 hotdog:text-yellow-100">photoSrc</code> to display photo
					</span>
				</div>
			{/if}
		</div>
	</div>
</section>
