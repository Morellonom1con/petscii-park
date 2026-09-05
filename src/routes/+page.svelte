<script lang="ts">
	import { petsciify } from "$lib/petscii";
	let files = $state<FileList | undefined>();
	let outputurl = $state<string | undefined>();
	let inputurl = $state<string | undefined>();
	$effect(() => {
		const file = files?.[0];
		if (!file) return;
		let cancelled = false;
		petsciify(file).then((blob) => {
			if (!cancelled) outputurl = URL.createObjectURL(blob);
		});
		inputurl = URL.createObjectURL(file);
		return () => {
			cancelled = true;
		};
	});
</script>

<h1>PETSCII Park</h1>
<p>Input an Image</p>
<input type="file" accept="image/*" alt="image input" bind:files />
{#if inputurl}
	<img src={inputurl} alt="input" />
{/if}
{#if outputurl}
	<img src={outputurl} alt="output" />
{/if}

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
