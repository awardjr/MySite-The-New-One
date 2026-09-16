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
