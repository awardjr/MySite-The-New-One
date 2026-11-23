type UploadResponse = { path?: unknown; error?: unknown };

export async function uploadImage(file: File): Promise<string> {
	const body = new FormData();
	body.append('file', file);

	let response: Response;
	try {
		response = await fetch('/admin/upload', { method: 'POST', body });
	} catch {
		throw new Error('Upload failed.');
	}

	const result = (await response.json().catch(() => null)) as UploadResponse | null;
	if (!response.ok || typeof result?.path !== 'string') {
		throw new Error(typeof result?.error === 'string' ? result.error : 'Upload failed.');
	}
	return result.path;
}
