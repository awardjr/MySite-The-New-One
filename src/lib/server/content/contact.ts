import { db } from '../db';

export type ContactLink = {
	label: string;
	href: string;
	icon: string;
	description: string;
};

const getContactLinksStmt = db.prepare(
	'SELECT label, href, icon, description FROM links ORDER BY sort_order, id'
);
const deleteContactLinksStmt = db.prepare('DELETE FROM links WHERE id IS NOT NULL');
const insertContactLinkStmt = db.prepare(
	'INSERT INTO links (label, href, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
);

export function getContact(): ContactLink[] {
	return getContactLinksStmt.all() as ContactLink[];
}

export function setContact(links: ContactLink[]): void {
	deleteContactLinksStmt.run();
	links.forEach((link, i) => {
		insertContactLinkStmt.run(link.label, link.href, link.icon, link.description, i);
	});
}
