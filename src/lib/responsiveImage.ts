export const MAX_IMAGE_WIDTH = 1920;
export const IMAGE_WIDTHS = [320, 640, 960, 1280];

const UPLOADED_WEBP = /^(\/uploads\/\d+-[0-9a-f]{12})-(\d+)\.webp$/;

export function uploadedImageName(id: string, width: number): string {
	return `${id}-${width}.webp`;
}

export function srcset(src: string): string | undefined {
	const match = UPLOADED_WEBP.exec(src);
	if (!match) return undefined;
	const [, base, full] = match;
	const widths = IMAGE_WIDTHS.filter((width) => width < Number(full));
	if (!widths.length) return undefined;
	return [...widths, Number(full)]
		.map((width) => `${uploadedImageName(base, width)} ${width}w`)
		.join(', ');
}
