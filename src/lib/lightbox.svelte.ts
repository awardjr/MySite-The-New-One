export const lightbox = $state({ src: '', alt: '' });

export function openLightbox(src: string, alt: string = '') {
	lightbox.src = src;
	lightbox.alt = alt;
}

export function closeLightbox() {
	openLightbox('');
}
