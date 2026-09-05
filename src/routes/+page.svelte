<script lang="ts">
	import { petsciify } from "$lib/petscii";
	import { getGlyphs } from "$lib/glyphs";
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
		const imgFile = imgFiles?.[0];
		const paletteFile = paletteFiles?.[0];
		if (!imgFile) return;
		let cancelled = false;
		petsciify(imgFile, paletteFile).then((blob) => {
			if (!cancelled) outputurl = URL.createObjectURL(blob);
		});
		inputurl = URL.createObjectURL(imgFile);
		return () => {
			cancelled = true;
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
