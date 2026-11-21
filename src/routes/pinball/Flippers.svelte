<script lang="ts">
	const sides = ['left', 'right'] as const;
	let flipped = $state({ left: false, right: false });
	const timers: Record<string, ReturnType<typeof setTimeout>> = {};

	function flip(side: (typeof sides)[number]) {
		flipped[side] = true;
		clearTimeout(timers[side]);
		timers[side] = setTimeout(() => (flipped[side] = false), 69);
	}
</script>

<div class="mt-12 flex justify-center gap-6">
	{#each sides as side (side)}
		<button type="button" aria-label="Flip the {side} flipper" onclick={() => flip(side)}>
			<svg viewBox="0 -30 124 100" class={['w-28', side === 'right' && '-scale-x-100']}>
				<g
					class="transition-transform motion-reduce:transition-none"
					style:transform-origin="16px 20px"
					style:transform="rotate({flipped[side] ? -20 : 28}deg)"
					style:transition-duration={flipped[side] ? '60ms' : '150ms'}
				>
					<path
						d="M16 6 L108 14 A6 6 0 0 1 108 26 L16 34 A14 14 0 0 1 16 6 Z"
						class="fill-page stroke-primary"
						stroke-width="4"
						stroke-linejoin="round"
					/>
					<circle cx="16" cy="20" r="4" class="fill-primary" />
				</g>
			</svg>
		</button>
	{/each}
</div>
