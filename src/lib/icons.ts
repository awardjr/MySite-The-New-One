// Registry of icon keys usable for contact links in the CMS. Content is
// stored as plain JSON, so icons are referenced by string key here rather
// than as FontAwesome objects directly. Add an entry to support a new icon.
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
	faXTwitter,
	faInstagram,
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
	twitter: faXTwitter,
	instagram: faInstagram,
	youtube: faYoutube
};

export const iconOptions = Object.keys(iconRegistry);

export function getIcon(key: string): IconDefinition {
	return iconRegistry[key] ?? faLink;
}
