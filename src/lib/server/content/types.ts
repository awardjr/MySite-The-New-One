import type { HomeContent } from './home';
import type { ContactLink } from './contact';
import type { WorkItem } from './works';
import type { PressItem } from './press';
import type { PinballMachine } from './pinball';
import type { Post } from './blog';
import type { PageHeadline } from './pageheadlines';

export type * from './home';
export type * from './contact';
export type * from './works';
export type * from './press';
export type * from './pinball';
export type * from './blog';
export type * from './pageheadlines';

export type SiteContent = {
	home: HomeContent;
	contact: ContactLink[];
	works: WorkItem[];
	press: PressItem[];
	pinball: PinballMachine[];
	blog: Post[];
	pageHeadlines: PageHeadline[];
};
