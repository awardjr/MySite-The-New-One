import { format, isValid, parse } from 'date-fns';

export function formatDate(date: string): string {
	const parsed = parse(date, 'yyyy-MM-dd', new Date());
	return isValid(parsed) ? format(parsed, 'MMMM d, yyyy') : date;
}
