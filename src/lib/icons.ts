import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faFileLines, faEnvelope, faLink, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faGithub, faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';

/** The icons a contact link can use, with the colour its card takes on. */
const contactIcons: Record<string, { icon: IconDefinition; color: string }> = {
	resume: { icon: faFileLines, color: '#475569' },
	email: { icon: faEnvelope, color: '#dc2626' },
	phone: { icon: faPhone, color: '#16a34a' },
	link: { icon: faLink, color: '#0d9488' },
	linkedin: { icon: faLinkedin, color: '#0a66c2' },
	github: { icon: faGithub, color: '#24292f' },
	twitch: { icon: faTwitch, color: '#9146ff' },
	youtube: { icon: faYoutube, color: '#e11d48' }
};

export const iconOptions = Object.keys(contactIcons);

/** A contact link's icon and colour. Unknown keys get the plain link icon. */
export function getIcon(key: string) {
	return contactIcons[key] ?? contactIcons.link;
}
