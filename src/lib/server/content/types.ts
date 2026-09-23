import type { HomeContent } from './home';
import type { ContactContent } from './contact';
import type { SkillsContent } from './skills';
import type { WorksContent } from './works';
import type { PressContent } from './press';
import type { PinballContent } from './pinball';
import type { BlogContent } from './blog';

export type * from './home';
export type * from './contact';
export type * from './skills';
export type * from './works';
export type * from './press';
export type * from './pinball';
export type * from './blog';

export type SiteContent = {
	home: HomeContent;
	contact: ContactContent;
	skills: SkillsContent;
	works: WorksContent;
	press: PressContent;
	pinball: PinballContent;
	blog: BlogContent;
};
