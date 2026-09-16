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

const SECTION_KEYS: (keyof SiteContent)[] = [
	'home',
	'contact',
	'skills',
	'works',
	'press',
	'pinball',
	'blog'
];

/** Returns an empty, correctly-shaped value for a section that has no stored data yet. */
function emptySection<K extends keyof SiteContent>(key: K): SiteContent[K] {
	switch (key) {
		case 'home':
			return {
				name: '',
				tagline: '',
				photoSrc: '',
				introParagraphs: []
			} as unknown as SiteContent[K];
		case 'contact':
			return { links: [] } as unknown as SiteContent[K];
		case 'skills':
			return { categories: [] } as unknown as SiteContent[K];
		case 'works':
			return { items: [] } as unknown as SiteContent[K];
		case 'press':
			return { items: [] } as unknown as SiteContent[K];
		case 'pinball':
			return { machines: [] } as unknown as SiteContent[K];
		case 'blog':
			return { posts: [] } as unknown as SiteContent[K];
		default:
			throw new Error(`Unknown content section: ${key}`);
	}
}

let cache: SiteContent | null = null;

const getSectionStmt = db.prepare('SELECT value FROM content_sections WHERE key = ?');
const upsertSectionStmt = db.prepare(
	'INSERT INTO content_sections (key, value) VALUES (@key, @value) ' +
		'ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);

function getSection<K extends keyof SiteContent>(key: K): SiteContent[K] {
	const row = getSectionStmt.get(key) as { value: string } | undefined;
	if (!row) {
		const value = emptySection(key);
		upsertSectionStmt.run({ key, value: JSON.stringify(value) });
		return value;
	}
	try {
		return JSON.parse(row.value);
	} catch {
		return emptySection(key);
	}
}

function setSection<K extends keyof SiteContent>(key: K, value: SiteContent[K]): void {
	upsertSectionStmt.run({ key, value: JSON.stringify(value) });
}

export function readContent(): SiteContent {
	if (cache) return cache;

	const content = {} as SiteContent;
	for (const key of SECTION_KEYS) {
		(content as any)[key] = getSection(key);
	}

	cache = content;
	return cache;
}

export function writeContent(content: SiteContent): void {
	const writeAll = db.transaction(() => {
		for (const key of SECTION_KEYS) {
			setSection(key, content[key]);
		}
	});
	writeAll();
	cache = content;
}

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
