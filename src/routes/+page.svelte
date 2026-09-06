<script lang="ts">
	import { petsciify, paletteFetch } from "$lib/petscii";
	import { getGlyphs, addGlyph, deleteGlyph } from "$lib/glyphs";
	import GlyphGallery from "$lib/GlyphGallery.svelte";
	import GlyphEditor from "$lib/GlyphEditor.svelte";
	import { onMount } from "svelte";

	let paletteFiles = $state<FileList | undefined>();
	let paletteString = $state<string | undefined>();
	let paletteSource = $state<"lospec" | "file">("lospec");
	let slug = $state("commodore64");

	let imgFiles = $state<FileList | undefined>();
	let outputurl = $state<string | undefined>();
	let inputurl = $state<string | undefined>();

	let glyphs = $state<number[][]>([]);
	let selected = $state(0);
	let saturation = $state(1);
	let contrast = $state(1);

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
		const currentGlyphs = $state.snapshot(glyphs);
		const currentPalette = paletteString;
		const currentSaturation = saturation;
		const currentContrast = contrast;
		const imgFile = imgFiles?.[0];

		if (!imgFile || !currentPalette) return;

		const controller = new AbortController();

		petsciify(
			imgFile,
			currentPalette,
			currentGlyphs,
			currentSaturation,
			currentContrast,
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
		return () => URL.revokeObjectURL(url);
	});

	function handleDelete() {
		deleteGlyph(glyphs, selected);
		if (selected >= glyphs.length) selected = glyphs.length - 1;
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
{#if inputurl}
	<img src={inputurl} alt="input" />
{/if}
{#if outputurl}
	<img src={outputurl} alt="output" />
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
