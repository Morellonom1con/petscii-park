<script lang="ts">
	let { color } = $props();
</script>

<div
	class="swatch"
	style="background-color: rgb({color[0]}, {color[1]}, {color[2]})"
></div>

<style>
	.swatch {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}
</style>
