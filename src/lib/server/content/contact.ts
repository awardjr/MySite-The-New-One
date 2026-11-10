import { db } from '../db';

export type ContactLink = {
	label: string;
	href: string;
	icon: string;
	description: string;
};

export type ContactContent = {
	links: ContactLink[];
};

const getContactLinksStmt = db.prepare(
	'SELECT label, href, icon, description FROM links ORDER BY sort_order, id'
);
const deleteContactLinksStmt = db.prepare('DELETE FROM links WHERE id IS NOT NULL');
const insertContactLinkStmt = db.prepare(
	'INSERT INTO links (label, href, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
);

export function getContact(): ContactContent {
	const rows = getContactLinksStmt.all() as { label: string; href: string; icon: string; description: string }[];
	return {
		links: rows.map((row) => ({
			label: row.label ?? '',
			href: row.href ?? '',
			icon: row.icon ?? '',
			description: row.description ?? ''
		}))
	};
}

export function setContact(value: ContactContent): void {
	deleteContactLinksStmt.run();
	const links = value.links ?? [];
	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		insertContactLinkStmt.run(link.label, link.href, link.icon, link.description, i);
	}
}
