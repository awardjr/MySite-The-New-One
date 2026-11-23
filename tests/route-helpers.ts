import { isActionFailure, isHttpError, isRedirect } from '@sveltejs/kit';
import { setActiveEvent } from './request-event';

type FieldValue = string | File | string[];

export function formData(fields: Record<string, FieldValue> = {}): FormData {
	const data = new FormData();
	for (const [name, value] of Object.entries(fields)) {
		for (const item of Array.isArray(value) ? value : [value]) data.append(name, item);
	}
	return data;
}

export function fakeCookies(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	const options = new Map<string, Record<string, unknown>>();
	return {
		values,
		options,
		get: (name: string) => values.get(name),
		set(name: string, value: string, cookieOptions: Record<string, unknown>) {
			values.set(name, value);
			options.set(name, cookieOptions);
		},
		delete(name: string) {
			values.delete(name);
		}
	};
}

let addressCounter = 0;

export function uniqueAddress(): string {
	addressCounter += 1;
	return `10.0.${Math.floor(addressCounter / 256)}.${addressCounter % 256}`;
}

interface EventOptions {
	fields?: Record<string, FieldValue>;
	url?: string;
	cookies?: ReturnType<typeof fakeCookies>;
	address?: string;
	params?: Record<string, string>;
	locals?: Partial<App.Locals>;
	method?: string;
}

export function cookieHeader(cookies: ReturnType<typeof fakeCookies>): string {
	return [...cookies.values]
		.map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
		.join('; ');
}

function requestEvent(options: EventOptions) {
	const url = options.url ?? 'https://example.test/';
	const method = options.method ?? 'POST';
	const address = options.address ?? uniqueAddress();
	const cookies = options.cookies ?? fakeCookies();
	const headers = { cookie: cookieHeader(cookies) };
	const event = {
		request: new Request(
			url,
			method === 'POST' ? { method, headers, body: formData(options.fields) } : { headers }
		),
		url: new URL(url),
		cookies,
		getClientAddress: () => address,
		params: options.params ?? {},
		locals: options.locals ?? {}
	};
	setActiveEvent(event);
	return event;
}

type RouteData = Record<string, unknown>;

export interface Outcome<T = RouteData> {
	kind: 'ok' | 'failure' | 'redirect' | 'error';
	status?: number;
	location?: string;
	data: T;
}

export async function outcome<T = RouteData>(run: () => unknown): Promise<Outcome<T>> {
	const noData = undefined as T;
	try {
		const result = await run();
		return isActionFailure(result)
			? { kind: 'failure', status: result.status, data: result.data as T }
			: { kind: 'ok', data: result as T };
	} catch (thrown) {
		if (isRedirect(thrown)) {
			return { kind: 'redirect', status: thrown.status, location: thrown.location, data: noData };
		}
		if (isHttpError(thrown)) return { kind: 'error', status: thrown.status, data: noData };
		throw thrown;
	}
}

type Handler = (event: never) => unknown;

export function submit<T = RouteData>(
	action: Handler,
	options: EventOptions = {}
): Promise<Outcome<T>> {
	return outcome<T>(() => action(requestEvent(options) as never));
}

export function loadPage<T = RouteData>(
	load: Handler,
	options: EventOptions = {}
): Promise<Outcome<T>> {
	return outcome<T>(() => load(requestEvent({ method: 'GET', ...options }) as never));
}
