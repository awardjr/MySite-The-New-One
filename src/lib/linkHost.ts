function parseWebLink(href: string): URL | null {
	if (!/^https?:\/\//i.test(href)) return null;
	try {
		return new URL(href);
	} catch {
		return null;
	}
}

export function linkHost(href: string): string | null {
	return parseWebLink(href)?.hostname.replace(/^www\./, '') ?? null;
}

export function linkDestination(href: string): string {
	const contact = /^(?:mailto|tel):([^?]*)/i.exec(href);
	if (contact) return contact[1];
	const url = parseWebLink(href);
	if (!url) return '';
	return `${linkHost(href)}${url.pathname}`.replace(/\/$/, '');
}
