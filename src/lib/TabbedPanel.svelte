<script lang="ts">
	let {
		tabs,
	}: {
		tabs: { label: string; content: import("svelte").Snippet }[];
	} = $props();

	let active = $state(0);
</script>

<div class="panel">
	<div class="tabs">
		{#each tabs as tab, i}
			<button
				class:active={i === active}
				onclick={() => (active = i)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="body">
		{@render tabs[active].content()}
	</div>
</div>

<style>
	.body {
		background-color: #202124;
	}
</style>
