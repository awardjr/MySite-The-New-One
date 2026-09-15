// Shared state for the image lightbox. Call `openLightbox(src, alt)` from any
// clickable <img> to expand it; the overlay itself lives in Lightbox.svelte.
let src = $state('');
let alt = $state('');

export function openLightbox(imageSrc: string, imageAlt: string = '') {
	src = imageSrc;
	alt = imageAlt;
}

export function closeLightbox() {
	src = '';
	alt = '';
}

export function getLightbox() {
	return {
		get src() {
			return src;
		},
		get alt() {
			return alt;
		}
	};
}
