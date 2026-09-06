<script lang="ts">
	let { glyph } = $props();
	$effect(() => {
		if (!glyph) return;
	});
</script>

{#if glyph}
	<div class="editor">
		{#each glyph as bit, i}
			<button
				class="cell"
				class:on={bit === 1}
				onclick={() => (glyph[i] = bit ? 0 : 1)}
			></button>
		{/each}
	</div>
{/if}

<style>
	.editor {
		display: grid;
		grid-template-columns: repeat(8, 32px);
	}
	.cell {
		height: 32px;
		width: 32px;
		padding: 0;
		border: none;
		background: #fff;
	}
	.cell.on {
		background: #000;
	}
</style>
