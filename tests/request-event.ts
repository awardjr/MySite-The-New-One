let active: unknown;

export function setActiveEvent(event: unknown): void {
	active = event;
}

export function getActiveEvent(): unknown {
	return active;
}
