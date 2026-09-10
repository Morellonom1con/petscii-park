<script lang="ts">
	import { petsciify, paletteFetch, getPalette } from "$lib/petscii";
	import { getGlyphs, addGlyph, deleteGlyph } from "$lib/glyphs";
	import GlyphGallery from "$lib/GlyphGallery.svelte";
	import GlyphEditor from "$lib/GlyphEditor.svelte";
	import { onMount } from "svelte";
	import PaletteGallery from "$lib/PaletteGallery.svelte";
	import ZoomViewport from "$lib/ZoomViewport.svelte";
	import TabbedPanel from "$lib/TabbedPanel.svelte";

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

<div
	style="background-color:#212024; margin: 0; padding: 12px;color: white; font-family: Pixelify Sans; font-size: 48px;"
>
	PETSCII Park
</div>
<input
	type="file"
	accept="image/*"
	aria-label="image input"
	bind:files={imgFiles}
/>
<div style="display: flex  ; gap: 16px; margin: 16px;">
	<ZoomViewport src={inputurl} width={inW} height={inH} alt="input" />
	<ZoomViewport src={outputurl} width={outW} height={outH} alt="output" />
	{#if outputurl}
		<a href={outputurl} download="output.png">Download</a>
	{/if}
</div>
<div style="display: flex; gap: 700px;">
	<div>
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
					(saturation =
						Math.round(saturation * 100) /
						100)}
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
				onchange={() =>
					(contrast =
						Math.round(contrast * 100) /
						100)}
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
					(chunkiness =
						Math.round(chunkiness * 100) /
						100)}
			/>
		</div>
	</div>
	{#snippet glyphTab()}
		<div style="display: flex; gap: 16px; align-items: flex-start;">
			<GlyphGallery {glyphs} bind:selectedGlyph />
			<GlyphEditor glyph={glyphs[selectedGlyph]} />
		</div>
		<button onclick={() => addGlyph(glyphs, selectedGlyph)}
			>Add</button
		>
		<button onclick={handleDelete}>Delete</button>
		<label class="file-button">
			Import
			<input
				type="file"
				accept=".txt"
				aria-label="glyph import"
				bind:files={glyphFiles}
			/>
		</label>
		<button onclick={handleExport}>Export Glyphs</button>
	{/snippet}
	{#snippet paletteTab()}
		<p>Palette source</p>
		<label>
			<input
				type="radio"
				bind:group={paletteSource}
				value="lospec"
			/>
			Lospec slug
		</label>
		<label>
			<input
				type="radio"
				bind:group={paletteSource}
				value="file"
			/>
			Upload .hex
		</label>

		{#if paletteSource === "lospec"}
			<input
				type="text"
				value={slug}
				onchange={(e) => (slug = e.currentTarget.value)}
				aria-label="lospec slug"
			/>
			<a
				href="https://lospec.com/palette-list"
				target="_blank">Browse Lospec</a
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
	{/snippet}
	<div>
		<TabbedPanel
			tabs={[
				{ label: "Palette", content: paletteTab },
				{ label: "Glyphs", content: glyphTab },
			]}
		/>
	</div>
</div>

<style>
	:global(div) {
		color: white;
	}
	:global(body) {
		background-color: dimgrey;
		margin: 0;
		padding: 0;
	}
	:global(p),
	:global(input),
	:global(img) {
		display: block;
	}
	.file-button input {
		display: none;
	}
	.file-button {
		display: inline-block;
		padding: 6px 12px;
		border: 1px solid #333;
		cursor: pointer;
		background: #f0f0f0;
	}
</style>
