// Server-only content store for the site's CMS.
//
// All editable page content lives in a SQLite database on disk
// (data/cms.sqlite3, seeded on first run from `defaultContent` below, one row
// per top-level section). Public pages read it via `readContent()` in their
// `+page.server.ts` load functions; admin pages read/write it via
// `readContent()` / `updateSection()`.
//
// This module can only be imported from server-side code (anything under
// `$lib/server`), which SvelteKit enforces automatically.
import { db } from './db';

export type ModeScore = {
	mode: string;
	score: string;
};

export type PinballMachine = {
	name: string;
	image: string;
	highScore: string;
	modeScores: ModeScore[];
};

export type WorkItem = {
	title: string;
	description: string;
	image: string;
	platforms: string[];
};

export type PressItem = {
	title: string;
	summary: string;
	href: string;
};

export type SkillCategory = {
	category: string;
	skills: string[];
};

export type ContactLink = {
	label: string;
	href: string;
	icon: string;
};

export type Post = {
	slug: string;
	title: string;
	date: string;
	image: string;
	preview: string;
	content: string;
};

export type HomeContent = {
	name: string;
	tagline: string;
	photoSrc: string;
	introParagraphs: string[];
};

export type SiteContent = {
	home: HomeContent;
	contact: { links: ContactLink[] };
	skills: { categories: SkillCategory[] };
	works: { items: WorkItem[] };
	press: { items: PressItem[] };
	pinball: { machines: PinballMachine[] };
	blog: { posts: Post[] };
};

// Used to seed content/site-content.json the first time the app runs, and as
// a fallback for any section missing from an older content file.
export const defaultContent: SiteContent = {
	home: {
		name: 'Arthur Ward Jr',
		tagline: 'Developer, creator, and builder.',
		photoSrc: '',
		introParagraphs: [
			'Welcome to my website! This is where I share my work, skills, side projects, and thoughts. Feel free to customize this intro with details about your background, current projects, or areas of expertise.',
			'Explore the sections above to see recent works and press mentions, or head over to the contact page to get in touch.'
		]
	},
	contact: {
		links: [
			{ label: 'Resume', href: '/resume.pdf', icon: 'resume' },
			{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-profile', icon: 'linkedin' },
			{ label: 'GitHub', href: 'https://github.com/your-username', icon: 'github' },
			{ label: 'Email', href: 'mailto:you@example.com', icon: 'email' }
		]
	},
	skills: {
		categories: [
			{
				category: 'Languages',
				skills: ['HTML', 'JavaScript', 'CSS', 'JSON', 'XML', 'SQL', 'Java', 'PHP', 'C#', '.NET']
			},
			{
				category: 'Frameworks & CMS',
				skills: ['Node.js', 'Laravel', 'ExpressionEngine', 'Craft CMS', 'WordPress', 'Unity3D']
			},
			{ category: 'Databases', skills: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis'] },
			{ category: 'Cloud & Infrastructure', skills: ['AWS', 'Docker', 'Apache', 'Nginx'] },
			{ category: 'Auth & Integrations', skills: ['SSO', 'OAuth2'] },
			{
				category: 'Tools & Practices',
				skills: ['Git', 'Unit Testing', 'Visual Studio', 'Jetbrains IDEs']
			},
			{ category: 'Operating Systems', skills: ['Microsoft Windows', 'Linux', 'MacOS'] }
		]
	},
	works: {
		items: [
			{
				title: 'Project Title',
				description:
					'A brief description of what this project is, what you built, and the technologies used.',
				image: '',
				platforms: ['web', 'windows', 'macos']
			}
		]
	},
	press: {
		items: [
			{
				title: 'Press Mention Title',
				summary:
					'A brief summary of the article or feature, what it covers, and why it is relevant.',
				href: ''
			}
		]
	},
	pinball: {
		machines: [
			{
				name: 'Sample Machine',
				image: '',
				highScore: '000,000,000',
				modeScores: [
					{ mode: 'Mode A', score: '000,000' },
					{ mode: 'Mode B', score: '000,000' }
				]
			}
		]
	},
	blog: {
		posts: [
			{
				slug: 'sample-post',
				title: 'Sample Post',
				date: '2026-01-01',
				image: '',
				preview:
					'This is a short preview of the sample post. Replace this with a teaser of your real content.',
				content:
					'This is the full body of the sample post. Replace this with your real writeup — it can be as long as you like, and will be shown in full both when a post is expanded on the blog listing page and on its own dedicated page.'
			}
		]
	}
};

let cache: SiteContent | null = null;

const getSectionStmt = db.prepare('SELECT value FROM content_sections WHERE key = ?');
const upsertSectionStmt = db.prepare(
	'INSERT INTO content_sections (key, value) VALUES (@key, @value) ' +
		'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);

/** Reads one top-level section from the database, seeding it from `defaultContent` if missing. */
function getSection<K extends keyof SiteContent>(key: K): SiteContent[K] {
	const row = getSectionStmt.get(key) as { value: string } | undefined;
	if (!row) {
		upsertSectionStmt.run({ key, value: JSON.stringify(defaultContent[key]) });
		return defaultContent[key];
	}
	try {
		return { ...defaultContent[key], ...JSON.parse(row.value) };
	} catch {
		return defaultContent[key];
	}
}

function setSection<K extends keyof SiteContent>(key: K, value: SiteContent[K]): void {
	upsertSectionStmt.run({ key, value: JSON.stringify(value) });
}

/** Reads the full site content, seeding any missing sections with defaults on first run. */
export function readContent(): SiteContent {
	if (cache) return cache;

	const sectionKeys = Object.keys(defaultContent) as (keyof SiteContent)[];
	const content = {} as SiteContent;
	for (const key of sectionKeys) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(content as any)[key] = getSection(key);
	}

	cache = content;
	return cache;
}

/** Overwrites every section. Prefer `updateSection` when only one section changed. */
export function writeContent(content: SiteContent): void {
	const sectionKeys = Object.keys(defaultContent) as (keyof SiteContent)[];
	const writeAll = db.transaction(() => {
		for (const key of sectionKeys) {
			setSection(key, content[key]);
		}
	});
	writeAll();
	cache = content;
}

/** Reads the current content, replaces one top-level section, and persists the result. */
export function updateSection<K extends keyof SiteContent>(
	key: K,
	value: SiteContent[K]
): SiteContent {
	const current = readContent();
	const updated = { ...current, [key]: value };
	setSection(key, value);
	cache = updated;
	return updated;
}
