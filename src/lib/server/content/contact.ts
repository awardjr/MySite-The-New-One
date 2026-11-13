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
	return { links: getContactLinksStmt.all() as ContactLink[] };
}

export function setContact(value: ContactContent): void {
	deleteContactLinksStmt.run();
	value.links.forEach((link, i) => {
		insertContactLinkStmt.run(link.label, link.href, link.icon, link.description, i);
	});
}
