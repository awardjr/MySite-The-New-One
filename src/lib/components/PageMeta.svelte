<script lang="ts">
	import { page } from '$app/state';

	/** The page title plus the description and tags search engines and link previews read. */
	let {
		title,
		description,
		image,
		publishedDate,
		noindex = false
	}: {
		title: string;
		/** Defaults to the full page title. */
		description?: string;
		/** Falls back to the site's home page photo. */
		image?: string;
		/** Marks the page as an article published on this date. */
		publishedDate?: string;
		noindex?: boolean;
	} = $props();

	let site = $derived(page.data as { siteName: string; origin: string; shareImage: string });
	let fullTitle = $derived(site.siteName ? `${title} - ${site.siteName}` : title);
	let summary = $derived(description || fullTitle);
	let url = $derived(new URL(page.url.pathname, site.origin).href);

	// Link previews don't support SVG, so an SVG is treated as no image.
	let imageUrl = $derived.by(() => {
		const path = [image, site.shareImage].find((src) => src && !/\.svg$/i.test(src));
		return path ? new URL(path, site.origin).href : undefined;
	});
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={summary} />
	<link rel="canonical" href={url} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{/if}

	{#if site.siteName}
		<meta property="og:site_name" content={site.siteName} />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={summary} />
	<meta property="og:url" content={url} />
	<meta property="og:type" content={publishedDate ? 'article' : 'website'} />
	{#if publishedDate}
		<meta property="article:published_time" content={publishedDate} />
	{/if}
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
	{/if}
	<meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
</svelte:head>
