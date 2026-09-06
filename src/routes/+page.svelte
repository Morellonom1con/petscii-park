<script lang="ts">
	import { petsciify } from "$lib/petscii";
	import { getGlyphs, addGlyph, deleteGlyph } from "$lib/glyphs";
	import GlyphGallery from "$lib/GlyphGallery.svelte";
	import { onMount } from "svelte";
	import GlyphEditor from "$lib/GlyphEditor.svelte";
	let paletteFiles = $state<FileList | undefined>();
	let imgFiles = $state<FileList | undefined>();
	let outputurl = $state<string | undefined>();
	let inputurl = $state<string | undefined>();
	let glyphs = $state<number[][]>([]);
	let selected = $state(0);
	onMount(async () => (glyphs = await getGlyphs()));
	$effect(() => {
		const currentGlyphs = $state.snapshot(glyphs);
		const imgFile = imgFiles?.[0];
		const paletteFile = paletteFiles?.[0];
		if (!imgFile) return;
		const controller = new AbortController();
		let cancelled = false;
		petsciify(
			imgFile,
			paletteFile,
			currentGlyphs,
			controller.signal,
		)
			.then((blob) => {
				if (!cancelled)
					outputurl = URL.createObjectURL(blob);
			})
			.catch(() => {});
		inputurl = URL.createObjectURL(imgFile);
		return () => {
			controller.abort();
		};
	});
</script>

<h1>PETSCII Park</h1>
<p>Input Image</p>
<input
	type="file"
	accept="image/*"
	aria-label="image input"
	bind:files={imgFiles}
/>
<p>Input Palette</p>
<input type="file" aria-label="palette input" bind:files={paletteFiles} />
{#if inputurl}
	<img src={inputurl} alt="input" />
{/if}
{#if outputurl}
	<img src={outputurl} alt="output" />
{/if}
<GlyphGallery {glyphs} bind:selected />
<button onclick={() => addGlyph(glyphs, selected)}>Add</button>
<button onclick={() => deleteGlyph(glyphs, selected)}>Delete</button>
<GlyphEditor glyph={glyphs[selected]} />

<style>
	:global(body) {
		background-color: darkslategray;
	}
	:global(h1),
	:global(p),
	:global(input),
	:global(img) {
		display: block;
	}
</style>
