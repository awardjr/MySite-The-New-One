/**
 * The site's public origin (e.g. `https://example.com`) from the `ORIGIN` environment variable.
 *
 * Without `ORIGIN`, the request's own origin is used. That value is derived from the `Host`
 * header, which a client can set to anything, so links that leave the site (password reset
 * emails, the RSS feed) should always be built from this function in production.
 */
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
