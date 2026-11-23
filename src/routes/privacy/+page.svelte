<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeading from '#lib/components/PageHeading.svelte';
	import PageMeta from '#lib/components/PageMeta.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageMeta title="Privacy" description="How the site handles your information." />

<section class="py-6 sm:py-10">
	<PageHeading headline="Privacy" subtitle="Last updated November 20, 2026" />

	<div class="mt-8 max-w-3xl space-y-8 text-lg leading-relaxed text-copy">
		<p>
			There is no analytics, tracking, or advertising of any kind used on this site. If you see
			something that resembles analytics, tracking, or advertising, and there has not been any
			change to this privacy policy, there is a chance your browser or device may be infected with
			malware.
		</p>

		<div class="space-y-2">
			<h2 class="text-xl font-bold text-heading">On Device Storage</h2>
			<p>
				Switching themes saves your choice in your browser. It's not stored on the server at all.
			</p>
		</div>

		<div class="space-y-2">
			<h2 class="text-xl font-bold text-heading">What the server stores</h2>
			<p>
				The server gets your IP address and standard browser info like all other sites but doesn't
				store them unless an error occurs. If this changes in the future for any reason, this page
				will be updated. If you would like to be updated when this page is changed, please subscribe
				to the RSS feed in the Posts section of the site. I will create a post explaining why the
				change was made.
			</p>
		</div>

		<div class="space-y-2">
			<h2 class="text-xl font-bold text-heading">Content from other sites</h2>
			<p>
				Some pages may show content hosted on other websites (eg. Twitch or Youtube), Your browser
				connects to that site, which receives your IP address and may set its own cookies or store
				your data. Those sites have their own privacy policies, so take care to read those before
				interacting with those embeds.
			</p>
		</div>

		{#if data.sections.contact}
			<div class="space-y-2">
				<h2 class="text-xl font-bold text-heading">Questions</h2>
				<p>
					If you have any questions about this, <a
						href={resolve('contact')}
						class="text-link underline"
					>
						visit the contact page</a
					> and send me an E-mail.
				</p>
			</div>
		{/if}
	</div>
</section>
