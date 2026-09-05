<script lang="ts">
	let { glyphs, selected = $bindable(0) } = $props();
	import GlyphPreview from "./GlyphPreview.svelte";
</script>

<div class="gallery">
	{#each glyphs as glyph, index}
		<div
			role="button"
			tabindex="0"
			style="cursor:pointer"
			onclick={() => (selected = index)}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					selected = index;
				}
			}}
			class:selected={index === selected}
		>
			<GlyphPreview {glyph} />
		</div>
	{/each}
</div>

<style>
	.gallery {
		background-color: slategray;
		display: grid;
		grid-template-columns: repeat(15, 28px);
		padding: 2px;
	}
	.selected {
		background-color: red;
	}
</style>
