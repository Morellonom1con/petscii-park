<script lang="ts">
	let { palette, selectedColor = $bindable(0) } = $props();
	import PalettePreview from "./PalettePreview.svelte";
</script>

<div class="gallery">
	{#each palette as color, index}
		<div
			role="button"
			tabindex="0"
			style="cursor:pointer"
			onclick={() => (selectedColor = index)}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					selectedColor = index;
				}
			}}
			class:selected={index === selectedColor}
		>
			<PalettePreview {color} />
		</div>
	{/each}
</div>

<style>
	.gallery {
		background-color: slategray;
		display: grid;
		grid-template-columns: repeat(10, 24px);
		padding: 2px;
	}
	.selected {
		outline: 2px solid red;
		outline-offset: -2px;
	}
</style>
