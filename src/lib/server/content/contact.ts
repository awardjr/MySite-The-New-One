import { db } from '../db';

export type ContactLink = {
	label: string;
	href: string;
	icon: string;
};

export type ContactContent = {
	links: ContactLink[];
};

const getContactLinksStmt = db.prepare(
	'SELECT label, href, icon FROM contact_links ORDER BY sort_order, id'
);
const deleteContactLinksStmt = db.prepare('DELETE FROM contact_links WHERE id IS NOT NULL');
const insertContactLinkStmt = db.prepare(
	'INSERT INTO contact_links (label, href, icon, sort_order) VALUES (?, ?, ?, ?)'
);

export function getContact(): ContactContent {
	const rows = getContactLinksStmt.all() as { label: string; href: string; icon: string }[];
	return {
		links: rows.map((row) => ({
			label: row.label ?? '',
			href: row.href ?? '',
			icon: row.icon ?? ''
		}))
	};
}

export function setContact(value: ContactContent): void {
	deleteContactLinksStmt.run();
	const links = value.links ?? [];
	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		insertContactLinkStmt.run(link.label, link.href, link.icon, i);
	}
}
