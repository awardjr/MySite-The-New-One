<script lang="ts">
	type Option = { id: string; title: string; image?: string; note?: string };

	let {
		label,
		name,
		options,
		selected = $bindable([]),
		emptyText = 'Nothing available.',
		onchange
	}: {
		label: string;
		name: string;
		options: Option[];
		selected: string[];
		emptyText?: string;
		/** Called whenever the selection changes. */
		onchange?: () => void;
	} = $props();

	let open = $state(false);
	let root: HTMLDivElement | undefined = $state();

	const chosen = $derived(
		selected.map((id) => options.find((o) => o.id === id)).filter((o) => !!o)
	);

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
		onchange?.();
	}

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="space-y-1" bind:this={root}>
	<span class="text-sm font-medium text-field-label">{label}</span>
	{#each selected as id (id)}
		<input type="hidden" {name} value={id} />
	{/each}

	<div class="relative">
		<button
			type="button"
			aria-haspopup="listbox"
			aria-expanded={open}
			onclick={() => (open = !open)}
			class="flex w-full items-center justify-between rounded-lg border border-field-border bg-field px-3 py-2 text-left text-sm text-field-text"
		>
			<span>{selected.length ? `${selected.length} selected` : 'Select…'}</span>
			<span aria-hidden="true">▾</span>
		</button>

		{#if open}
			<ul
				role="listbox"
				aria-multiselectable="true"
				class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-field-border bg-card shadow-lg"
			>
				{#each options as option (option.id)}
					{@const isSelected = selected.includes(option.id)}
					<li role="option" aria-selected={isSelected}>
						<button
							type="button"
							onclick={() => toggle(option.id)}
							class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-field-text hover:bg-badge"
						>
							<input
								type="checkbox"
								checked={isSelected}
								tabindex="-1"
								class="pointer-events-none"
							/>
							{#if option.image}
								<img src={option.image} alt="" class="h-10 w-14 rounded object-cover" />
							{:else}
								<span class="h-10 w-14 rounded bg-badge"></span>
							{/if}
							<span class="min-w-0 flex-1 truncate">{option.title}{option.note ?? ''}</span>
						</button>
					</li>
				{:else}
					<li class="px-3 py-2 text-xs text-form-hint">{emptyText}</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if chosen.length}
		<ul class="flex flex-wrap gap-2 pt-1">
			{#each chosen as option (option.id)}
				<li
					class="flex items-center gap-2 rounded-lg bg-badge py-1 pl-1 pr-2 text-xs text-badge-text"
				>
					{#if option.image}
						<img src={option.image} alt="" class="h-6 w-8 rounded object-cover" />
					{/if}
					<span class="max-w-48 truncate">{option.title}</span>
					<button type="button" aria-label="Remove {option.title}" onclick={() => toggle(option.id)}
						>×</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>
