/** The image shown enlarged over the page; an empty `src` means the lightbox is closed. */
export const lightbox = $state({ src: '', alt: '' });

export function openLightbox(src: string, alt: string = '') {
	lightbox.src = src;
	lightbox.alt = alt;
}

export function closeLightbox() {
	openLightbox('');
}
