<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let notFound = $derived(page.status === 404);
</script>

<section class="flex flex-col items-center py-16 text-center sm:py-24">
	<p class="text-sm font-semibold tracking-wider text-eyebrow uppercase">Error {page.status}</p>
	<h1 class="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
		{notFound ? 'HUH?' : 'Uh, What?'}
	</h1>
	<p class="mt-3 max-w-md text-lg text-muted">
		{notFound ? 'What are you doing here?' : 'Please try again.'}
	</p>
	<a href={resolve('/')} class="btn-primary mt-6 inline-block">Back to home</a>
</section>
