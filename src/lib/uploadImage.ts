/**
 * Uploads an image through the admin upload endpoint and returns its public path.
 * Throws an Error with a message suitable for showing to the admin if the upload fails.
 */
export async function uploadImage(file: File): Promise<string> {
	const body = new FormData();
	body.append('file', file);

	let response: Response;
	try {
		response = await fetch('/admin/upload', { method: 'POST', body });
	} catch {
		throw new Error('Upload failed.');
	}

	const result = await response.json().catch(() => null);
	if (!response.ok || typeof result?.path !== 'string') {
		throw new Error(result?.error ?? 'Upload failed.');
	}
	return result.path;
}
