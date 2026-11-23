type FormValues = [name: string, value: string][];

const savedValues = new Map<HTMLFormElement, FormValues>();

function sortedByName(values: FormValues): FormValues {
	return values.sort(([a], [b]) => a.localeCompare(b));
}

function valuesOf(data: FormData): FormValues {
	return sortedByName(
		[...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
	);
}

export function trackChanges(form: HTMLFormElement) {
	savedValues.set(form, valuesOf(new FormData(form)));
	return {
		destroy() {
			savedValues.delete(form);
		}
	};
}

export function markSaved(form: HTMLFormElement, submitted: FormData): void {
	if (savedValues.has(form)) savedValues.set(form, valuesOf(submitted));
}

export function acceptCurrentValue(form: HTMLFormElement, field: string): void {
	const saved = savedValues.get(form);
	if (!saved) return;
	const others = saved.filter(([name]) => name !== field);
	const current = valuesOf(new FormData(form)).filter(([name]) => name === field);
	savedValues.set(form, sortedByName([...others, ...current]));
}

export function formHasChanges(form: HTMLFormElement): boolean {
	const current = JSON.stringify(valuesOf(new FormData(form)));
	return current !== JSON.stringify(savedValues.get(form));
}

export function hasUnsavedChanges(): boolean {
	return [...savedValues.keys()].some(formHasChanges);
}
