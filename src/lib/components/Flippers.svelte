<script lang="ts">
	const sides = ['left', 'right'] as const;
	const leftArrow = 'ArrowLeft';
	const rightArrow = 'ArrowRight';
	let flipped = $state({ left: false, right: false });
	const timers: Record<string, ReturnType<typeof setTimeout>> = {};

	function flip(side: (typeof sides)[number], keys: boolean) {
		flipped[side] = true;
		if (keys) {
			return;
		}
		clearTimeout(timers[side]);
		timers[side] = setTimeout(() => unflip(side), 69);
	}

	function unflip(side: (typeof sides)[number]) {
		flipped[side] = false;
	}

	function on_key_down(event: KeyboardEvent) {
		switch (event.key) {
			case leftArrow:
				flip('left', true);
				break;

			case rightArrow:
				flip('right', true);
				break;
		}
	}

	function on_key_up(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
				unflip('left');
				break;

			case 'ArrowRight':
				unflip('right');
				break;
		}
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
					style:transition-duration={flipped[side] ? '69ms' : '69ms'}
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

<svelte:window on:keydown={on_key_down} on:keyup={on_key_up} />
