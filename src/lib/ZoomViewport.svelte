<script lang="ts">
	let {
		src,
		width = 0,
		height = 0,
		alt = "",
	}: {
		src: string | undefined;
		width?: number;
		height?: number;
		alt?: string;
	} = $props();

	let viewport: HTMLDivElement;
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let panning = false;

	export function fitToView() {
		if (!width || !height || !viewport) return;
		const rect = viewport.getBoundingClientRect();
		let fit = 0;
		fit = Math.min(rect.width / width, rect.height / height);
		zoom = fit;
		panX = (rect.width - width * fit) / 2;
		panY = (rect.height - height * fit) / 2;
	}

	$effect(() => {
		width;
		height;
		src;
		fitToView();
	});

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 1) return;
		e.preventDefault();
		panning = true;
		viewport.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!panning) return;
		panX += e.movementX;
		panY += e.movementY;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!panning) return;
		panning = false;
		viewport.releasePointerCapture(e.pointerId);
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = viewport.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;

		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		const newZoom = Math.min(8, Math.max(0.1, zoom * factor));
		const ratio = newZoom / zoom;

		panX = cx - (cx - panX) * ratio;
		panY = cy - (cy - panY) * ratio;
		zoom = newZoom;
	}
</script>

<div class="wrapper">
	<div
		class="viewport"
		role="application"
		aria-label={alt || "image viewport"}
		bind:this={viewport}
		onwheel={handleWheel}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onauxclick={(e) => e.preventDefault()}
	>
		{#if src}
			<div
				class="content"
				style="transform: translate({panX}px, {panY}px) scale({zoom})"
			>
				<img {src} {alt} />
			</div>
		{/if}
	</div>
	<div class="controls">
		<button onclick={fitToView}>Fit</button>
		<span>{Math.round(zoom * 100)}%</span>
	</div>
</div>

<style>
	.wrapper {
		width: 100%;
		max-width: 800px;
	}
	.viewport {
		width: 100%;
		height: 500px;
		overflow: hidden;
		position: relative;
		background-color: #1a1a1a;
		touch-action: none;
		border-radius: 15px;
	}
	.content {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		width: fit-content;
	}
	.content img {
		display: block;
		image-rendering: pixelated;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}
</style>
