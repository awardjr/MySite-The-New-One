import { saveUploadedImage, UploadError } from '#lib/server/uploads.js';
import type { RequestHandler } from './$types';

// Auth is already enforced globally for every /admin/* route in hooks.server.ts.
export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file');

	if (!(file instanceof File)) {
		return Response.json({ error: 'No file was uploaded.' }, { status: 400 });
	}

	try {
		const path = await saveUploadedImage(file);
		return Response.json({ path });
	} catch (err) {
		if (err instanceof UploadError) {
			return Response.json({ error: err.message }, { status: 400 });
		}
		return Response.json({ error: 'Upload failed.' }, { status: 500 });
	}
};
