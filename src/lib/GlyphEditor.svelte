<script lang="ts">
	let { glyph } = $props();
	let editor: HTMLCanvasElement;
	const fg = "#000000",
		bg = "#ffffff";
	$effect(() => {
		if (!glyph) return;
		const ctx = editor.getContext("2d")!;
		for (let i = 0; i < 64; i++) {
			ctx.fillStyle = glyph[i] === 1 ? fg : bg;
			ctx.fillRect(i % 8, Math.floor(i / 8), 1, 1);
		}
	});
</script>

<canvas bind:this={editor} width="8" height="8"></canvas>

<style>
	canvas {
		width: 256px;
		height: 256px;
		image-rendering: pixelated;
	}
</style>
