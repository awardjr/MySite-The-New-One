export type MediaProvider = {
	name: string;
	url: RegExp[];
	src: (match: RegExpMatchArray, parent: string) => string;
	style: string;
};

const VIDEO = 'aspect-ratio:16/9';
const BLUESKY_EMBED = 'https://embed.bsky.app';

export const mediaProviders: MediaProvider[] = [
	{
		name: 'YouTube',
		url: [
			/^(?:m\.)?youtube\.com\/watch\?v=([\w-]+)(?:&t=(\d+))?/,
			/^(?:m\.)?youtube\.com\/shorts\/([\w-]+)(?:\?t=(\d+))?/,
			/^(?:m\.)?youtube\.com\/v\/([\w-]+)(?:\?t=(\d+))?/,
			/^youtube\.com\/embed\/([\w-]+)(?:\?start=(\d+))?/,
			/^youtu\.be\/([\w-]+)(?:\?t=(\d+))?/
		],
		src: ([, id, start]) => `https://www.youtube.com/embed/${id}${start ? `?start=${start}` : ''}`,
		style: VIDEO
	},
	{
		name: 'Vimeo',
		url: [
			/^vimeo\.com\/(\d+)/,
			/^vimeo\.com\/[^/]+\/[^/]+\/video\/(\d+)/,
			/^vimeo\.com\/album\/[^/]+\/video\/(\d+)/,
			/^vimeo\.com\/channels\/[^/]+\/(\d+)/,
			/^vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
			/^vimeo\.com\/ondemand\/[^/]+\/(\d+)/,
			/^player\.vimeo\.com\/video\/(\d+)/
		],
		src: ([, id]) => `https://player.vimeo.com/video/${id}`,
		style: VIDEO
	},
	{
		name: 'Dailymotion',
		url: [/^dailymotion\.com\/video\/(\w+)/, /^dai\.ly\/(\w+)/],
		src: ([, id]) => `https://www.dailymotion.com/embed/video/${id}`,
		style: VIDEO
	},
	{
		name: 'Spotify',
		url: [/^open\.spotify\.com\/(track\/\w+)/],
		src: ([, path]) => `https://open.spotify.com/embed/${path}`,
		style: 'height:80px'
	},
	{
		name: 'Spotify',
		url: [/^open\.spotify\.com\/((?:album|artist)\/\w+)/],
		src: ([, path]) => `https://open.spotify.com/embed/${path}`,
		style: 'aspect-ratio:100/126'
	},
	{
		name: 'Twitch',
		url: [/^(?:m\.)?twitch\.tv\/videos\/(\d+)/],
		src: ([, id], parent) =>
			`https://player.twitch.tv/?video=${id}&parent=${parent}&autoplay=false`,
		style: VIDEO
	},
	{
		name: 'Twitch',
		url: [/^clips\.twitch\.tv\/([\w-]+)/, /^(?:m\.)?twitch\.tv\/\w+\/clip\/([\w-]+)/],
		src: ([, slug], parent) =>
			`https://clips.twitch.tv/embed?clip=${slug}&parent=${parent}&autoplay=false`,
		style: VIDEO
	},
	{
		name: 'Twitch',
		url: [/^(?:m\.)?twitch\.tv\/(\w+)\/?(?:[?#]|$)/],
		src: ([, channel], parent) =>
			`https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`,
		style: VIDEO
	},
	{
		name: 'Bluesky',
		url: [/^bsky\.app\/profile\/(did:[\w:.%-]+)\/post\/(\w+)/],
		src: ([, did, rkey]) =>
			`${BLUESKY_EMBED}/embed/${did}/app.bsky.feed.post/${rkey}?colorMode=system`,
		style: 'max-width:600px;height:240px;border-radius:32px'
	}
];

export function playerAttributes(
	provider: MediaProvider,
	match: RegExpMatchArray,
	parent: string
): Record<string, string> {
	return {
		src: provider.src(match, parent),
		title: `${provider.name} embed`,
		style: `display:block;width:100%;margin:0 auto;border:0;${provider.style}`,
		allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
		allowfullscreen: '',
		loading: 'lazy',
		referrerpolicy: 'strict-origin-when-cross-origin',
		scrolling: 'no'
	};
}

export function mediaPlayer(url: string, parent: string): Record<string, string> | null {
	const bare = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
	for (const provider of mediaProviders) {
		for (const pattern of provider.url) {
			const match = bare.match(pattern);
			if (match) return playerAttributes(provider, match, parent);
		}
	}
	return null;
}

export function playerHtml(attributes: Record<string, string>): string {
	const attrs = Object.entries(attributes)
		.map(([name, value]) => `${name}="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`)
		.join(' ');
	return `<iframe ${attrs}></iframe>`;
}
