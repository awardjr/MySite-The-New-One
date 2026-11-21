import { resolve } from '$app/paths';

/** The admin area's sections in menu order, with the description the dashboard shows for each. */
export const adminSections = [
	{
		href: resolve('admin/home'),
		label: 'Home',
		description: 'Headline, name, tagline, photo, and intro text.'
	},
	{
		href: resolve('admin/blog'),
		label: 'Blog',
		description: 'Headline, subtitle, and blog posts.'
	},
	{
		href: resolve('admin/contact'),
		label: 'Contact',
		description: 'Headline, subtitle, and contact links.'
	},
	{
		href: resolve('admin/works'),
		label: 'Works',
		description: 'Headline, subtitle, and project cards.'
	},
	{
		href: resolve('admin/press'),
		label: 'Press',
		description: 'Headline, subtitle, and press mentions.'
	},
	{
		href: resolve('admin/pinball'),
		label: 'Pinball',
		description: 'Headline, subtitle, and pinball machines.'
	},
	{
		href: resolve('admin/settings'),
		label: 'Settings',
		description: 'Profile, password, two-factor authentication, and recovery code.'
	}
];

export const SETUP_ROUTE = '/admin/setup';

/** Route ids of the admin pages that work without signing in. They show no admin menu. */
export const signInRoutes = new Set<string>([
	'/admin/login',
	SETUP_ROUTE,
	'/admin/forgot-password',
	'/admin/reset'
]);
