<script lang="ts">
	import { petsciify, paletteFetch, getPalette } from "$lib/petscii";
	import { getGlyphs, addGlyph, deleteGlyph } from "$lib/glyphs";
	import GlyphGallery from "$lib/GlyphGallery.svelte";
	import GlyphEditor from "$lib/GlyphEditor.svelte";
	import { onMount } from "svelte";
	import PaletteGallery from "$lib/PaletteGallery.svelte";
	import ZoomViewport from "$lib/ZoomViewport.svelte";

	let paletteFiles = $state<FileList | undefined>();
	let glyphFiles = $state<FileList | undefined>();
	let paletteString = $state<string | undefined>();
	let paletteSource = $state<"lospec" | "file">("lospec");
	let slug = $state("commodore64");
	const palette = $derived(
		paletteString ? getPalette(paletteString) : [],
	);
	let imgFiles = $state<FileList | undefined>();
	let outputurl = $state<string | undefined>();
	let inputurl = $state<string | undefined>();
	let inW = $state(0);
	let inH = $state(0);

	let glyphs = $state<number[][]>([]);
	let selectedGlyph = $state(0);
	let selectedColor = $state(0);
	let saturation = $state(1);
	let contrast = $state(1);
	let chunkiness = $state(40);
	const outW = $derived(chunkiness * 8 * 2);
	const outH = $derived(Math.round((chunkiness * inH) / inW) * 8 * 2);

	onMount(async () => (glyphs = await getGlyphs()));

	$effect(() => {
		const source = paletteSource;
		const currentSlug = slug;
		const file = paletteFiles?.[0];

		let cancelled = false;

		if (source === "lospec") {
			if (!currentSlug) return;
			paletteFetch(currentSlug)
				.then((text) => {
					if (!cancelled) paletteString = text;
				})
				.catch(() => {});
		} else {
			if (!file) return;
			file.text().then((text) => {
				if (!cancelled) paletteString = text;
			});
		}

		return () => {
			cancelled = true;
		};
	});
	$effect(() => {
		const file = glyphFiles?.[0];
		if (!file) return;

		let cancelled = false;
		getGlyphs(file).then((loaded) => {
			if (cancelled) return;
			glyphs = loaded;
			if (selectedGlyph >= loaded.length)
				selectedGlyph = loaded.length - 1;
		});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const currentGlyphs = $state.snapshot(glyphs);
		const currentPalette = paletteString;
		const currentSaturation = saturation;
		const currentContrast = contrast;
		const currentChunkiness = chunkiness;
		const imgFile = imgFiles?.[0];

		if (!imgFile || !currentPalette) return;

		const controller = new AbortController();

		petsciify(
			imgFile,
			currentPalette,
			currentGlyphs,
			currentSaturation,
			currentContrast,
			currentChunkiness,
			controller.signal,
		)
			.then((blob) => {
				const url = URL.createObjectURL(blob);
				if (outputurl) URL.revokeObjectURL(outputurl);
				outputurl = url;
			})
			.catch(() => {});

		return () => controller.abort();
	});

	$effect(() => {
		const imgFile = imgFiles?.[0];
		if (!imgFile) return;
		const url = URL.createObjectURL(imgFile);
		inputurl = url;
		let cancelled = false;
		createImageBitmap(imgFile).then((bmp) => {
			if (!cancelled) {
				inW = bmp.width;
				inH = bmp.height;
			}
			bmp.close();
		});

		return () => {
			cancelled = true;
			URL.revokeObjectURL(url);
		};
	});
	function handleDelete() {
		deleteGlyph(glyphs, selectedGlyph);
		if (selectedGlyph >= glyphs.length)
			selectedGlyph = glyphs.length - 1;
	}

	function handleExport() {
		const text = $state.snapshot(glyphs).flat().join("");
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "glyphbitstring.txt";
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<h1>PETSCII Park</h1>
<p>Input Image</p>
<input
	type="file"
	accept="image/*"
	aria-label="image input"
	bind:files={imgFiles}
/>
<p>Palette source</p>
<label>
	<input type="radio" bind:group={paletteSource} value="lospec" />
	Lospec slug
</label>
<label>
	<input type="radio" bind:group={paletteSource} value="file" />
	Upload .hex
</label>

{#if paletteSource === "lospec"}
	<input
		type="text"
		value={slug}
		onchange={(e) => (slug = e.currentTarget.value)}
		aria-label="lospec slug"
	/>
	<a href="https://lospec.com/palette-list" target="_blank"
		>Browse Lospec</a
	>
{:else}
	<input
		type="file"
		accept=".hex"
		aria-label="palette input"
		bind:files={paletteFiles}
	/>
{/if}
<PaletteGallery {palette} bind:selectedColor />
<ZoomViewport src={inputurl} width={inW} height={inH} alt="input" />

{#if inputurl}
	<a href={inputurl} download="input.png">Download</a>
{/if}
<ZoomViewport src={outputurl} width={outW} height={outH} alt="output" />
{#if outputurl}
	<a href={outputurl} download="output.png">Download</a>
{/if}
<div>
	<label>Saturation</label>
	<input
		type="range"
		min="0"
		max="2"
		step="0.01"
		bind:value={saturation}
	/>
	<input
		type="number"
		min="0"
		max="2"
		step="0.01"
		bind:value={saturation}
		onchange={() =>
			(saturation = Math.round(saturation * 100) / 100)}
	/>
</div>
<div>
	<label>Contrast</label>
	<input
		type="range"
		min="0.5"
		max="2"
		step="0.01"
		bind:value={contrast}
	/>
	<input
		type="number"
		min="0"
		max="2"
		step="0.01"
		bind:value={contrast}
		onchange={() => (contrast = Math.round(contrast * 100) / 100)}
	/>
</div>
<div>
	<label>Chunkiness</label>
	<input
		type="range"
		min="20"
		max="100"
		step="1"
		bind:value={chunkiness}
	/>
	<input
		type="number"
		min="20"
		max={Math.floor(inW / 8)}
		step="1"
		bind:value={chunkiness}
		onchange={() =>
			(chunkiness = Math.round(chunkiness * 100) / 100)}
	/>
</div>
<label>Import Glyphs</label>
<input
	type="file"
	accept=".txt"
	aria-label="glyph import"
	bind:files={glyphFiles}
/>
<button onclick={handleExport}>Export Glyphs</button>
<GlyphGallery {glyphs} bind:selectedGlyph />
<button onclick={() => addGlyph(glyphs, selectedGlyph)}>Add</button>
<button onclick={handleDelete}>Delete</button>
<GlyphEditor glyph={glyphs[selectedGlyph]} />

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
