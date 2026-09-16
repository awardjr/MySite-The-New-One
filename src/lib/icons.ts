import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
	faFileLines,
	faEnvelope,
	faLink,
	faGlobe,
	faPhone
} from '@fortawesome/free-solid-svg-icons';
import {
	faLinkedin,
	faGithub,
	faTwitch,
	faYoutube
} from '@fortawesome/free-brands-svg-icons';

export const iconRegistry: Record<string, IconDefinition> = {
	resume: faFileLines,
	email: faEnvelope,
	phone: faPhone,
	link: faLink,
	globe: faGlobe,
	linkedin: faLinkedin,
	github: faGithub,
	twitch: faTwitch
};

export const iconOptions = Object.keys(iconRegistry);

export function getIcon(key: string): IconDefinition {
	return iconRegistry[key] ?? faLink;
}
