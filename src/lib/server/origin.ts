export function siteOrigin(requestUrl: URL): string {
	const configured = process.env.ORIGIN;
	if (configured) {
		try {
			return new URL(configured).origin;
		} catch {
			console.error(`[CONFIG] ORIGIN is not a valid URL: ${configured}`);
		}
	}
	return requestUrl.origin;
}
