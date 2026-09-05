<script lang="ts">
	let { glyph } = $props();
	let canvas: HTMLCanvasElement;
	const fg = "#ffffff",
		bg = "#000000";
	$effect(() => {
		const ctx = canvas.getContext("2d")!;
		for (let i = 0; i < 64; i++) {
			ctx.fillStyle = glyph[i] === 1 ? fg : bg;
			ctx.fillRect(i % 8, Math.floor(i / 8), 1, 1);
		}
	});
</script>

<canvas bind:this={canvas} width="8" height="8"></canvas>

<style>
	canvas {
		width: 48px;
		height: 48px;
		image-rendering: pixelated;
	}
</style>
