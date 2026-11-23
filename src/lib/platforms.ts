import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import {
	faAndroid,
	faApple,
	faAppStoreIos,
	faLinux,
	faPlaystation,
	faWindows
} from '@fortawesome/free-brands-svg-icons';

const faNintendoSwitch: IconDefinition = {
	prefix: 'fab',
	iconName: 'nintendo-switch' as string as IconDefinition['iconName'],
	icon: [
		24,
		24,
		[],
		'',
		'M14.176 24h3.674c3.376 0 6.15-2.774 6.15-6.15V6.15C24 2.775 21.226 0 17.85 0H14.1c-.074 0-.15.074-.15.15v23.7c-.001.076.075.15.226.15zm4.574-13.199c1.351 0 2.399 1.125 2.399 2.398 0 1.352-1.125 2.4-2.399 2.4-1.35 0-2.4-1.049-2.4-2.4-.075-1.349 1.05-2.398 2.4-2.398zM11.4 0H6.15C2.775 0 0 2.775 0 6.15v11.7C0 21.226 2.775 24 6.15 24h5.25c.074 0 .15-.074.15-.149V.15c.001-.076-.075-.15-.15-.15zM9.676 22.051H6.15c-2.326 0-4.201-1.875-4.201-4.201V6.15c0-2.326 1.875-4.201 4.201-4.201H9.6l.076 20.102zM3.75 7.199c0 1.275.975 2.25 2.25 2.25s2.25-.975 2.25-2.25c0-1.273-.975-2.25-2.25-2.25s-2.25.977-2.25 2.25z'
	]
};

export const platforms: { key: string; label: string; icon: IconDefinition }[] = [
	{ key: 'web', label: 'Web', icon: faGlobe },
	{ key: 'windows', label: 'Windows', icon: faWindows },
	{ key: 'macos', label: 'macOS', icon: faApple },
	{ key: 'linux', label: 'Linux', icon: faLinux },
	{ key: 'ios', label: 'iOS', icon: faAppStoreIos },
	{ key: 'android', label: 'Android', icon: faAndroid },
	{ key: 'playstation', label: 'PlayStation', icon: faPlaystation },
	{ key: 'switch', label: 'Nintendo Switch', icon: faNintendoSwitch }
];

export function getPlatform(key: string) {
	return platforms.find((platform) => platform.key === key);
}
