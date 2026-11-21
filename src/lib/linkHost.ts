function parseWebLink(href: string): URL | null {
	if (!/^https?:\/\//i.test(href)) return null;
	try {
		return new URL(href);
	} catch {
		return null;
	}
}

/** The site a web link goes to, such as "example.com". Null for any other kind of link. */
export function linkHost(href: string): string | null {
	return parseWebLink(href)?.hostname.replace(/^www\./, '') ?? null;
}

/**
 * A short, readable form of where a link goes: "example.com/page" for a web link, or the address
 * or number of a mailto: or tel: link. Empty for anything else, such as a link within this site.
 */
export function linkDestination(href: string): string {
	const contact = /^(?:mailto|tel):([^?]*)/i.exec(href);
	if (contact) return contact[1];
	const url = parseWebLink(href);
	if (!url) return '';
	return `${linkHost(href)}${url.pathname}`.replace(/\/$/, '');
}
