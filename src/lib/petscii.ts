import ndarray from "ndarray"

async function getGlyphs() {
	const glyphFile = await fetch("/glyphbitstring.txt")
	const glyphText = await glyphFile.text()
	const glyphs = []
	for (let i = 0; i < glyphText.length / 64; i++) {
		let arr = []
		for (let j = 0; j < 64; j++) {
			if (glyphText[i * 64 + j] == '1')
				arr[j] = 1
			else
				arr[j] = 0
		}
		glyphs.push(arr)
	}
	return glyphs
}

function srgbToLinear(
	image: ndarray
) {
	const shape = image.shape
	const height = shape[0]
	const width = shape[1]
	for (let k = 0; k < 3; k++) {
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				if (image.get(i, j, k) / 255 <= 0.04045) image.set(i, j, k, (image.get(i, j, k) / 255 / 12.92) * 255);
				else
					image.set(i, j, k, Math.pow(((image.get(i, j, k) / 255 + 0.055) / 1.055), 2.4) * 255)
			}
		}
	}
}

function vbox(
	image: ndarray
) {
	const shape = image.shape
	const height = shape[0]
	const width = shape[1]
	let tempData = new Uint8ClampedArray(image.data)
	let tempDataArray = ndarray(tempData, [height, width, 4])
	for (let k = 0; k < 3; k++) {
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				let sum = 0
				for (let di = -1; di < 2; di++) {
					const yi = Math.min(Math.max(i + di, 0), height - 1)
					sum += tempDataArray.get(yi, j, k)
				}
				image.set(i, j, k, sum / 3)
			}
		}
	}
}

function hbox(
	image: ndarray
) {
	const shape = image.shape
	const height = shape[0]
	const width = shape[1]
	let tempData = new Uint8ClampedArray(image.data)
	let tempDataArray = ndarray(tempData, [height, width, 4])
	for (let k = 0; k < 3; k++) {
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				let sum = 0
				for (let dj = -1; dj < 2; dj++) {
					const xj = Math.min(Math.max(j + dj, 0), width - 1)
					sum += tempDataArray.get(i, xj, k)
				}
				image.set(i, j, k, sum / 3)
			}
		}
	}
}

function linearToSrgb(
	image: ndarray
) {
	const shape = image.shape
	const height = shape[0]
	const width = shape[1]
	for (let k = 0; k < 3; k++)
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				if (image.get(i, j, k) / 255 <= 0.0031308) image.set(i, j, k, (image.get(i, j, k) / 255 * 12.92) * 255);
				else
					image.set(i, j, k, (Math.pow(image.get(i, j, k) / 255, 1 / 2.4) * 1.055 - 0.055) * 255)
			}
		}
}

function downsample(
	image: ndarray,
	newHeight: number,
	newWidth: number
) {
	const shape = image.shape
	const height = shape[0]
	const width = shape[1]
	const scaleH = height / newHeight
	const scaleW = width / newWidth
	let tempData = new Uint8ClampedArray(image.data)
	let tempDataArray = ndarray(tempData, [height, width, 4])
	for (let k = 0; k < 3; k++)
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < newWidth; j++) {
				let sum = 0
				let totalWeight = 0
				for (let s = Math.floor(j * scaleW); s < Math.ceil((j + 1) * scaleW); s++) {
					let overlap = Math.min((j + 1) * scaleW, s + 1) - Math.max(j * scaleW, s)
					if (overlap > 0) {
						sum += tempDataArray.get(i, s, k) * overlap
						totalWeight += overlap
					}
				}
				image.set(i, j, k, sum / totalWeight)
			}
		}
	tempData = new Uint8ClampedArray(image.data)
	tempDataArray = ndarray(tempData, [height, width, 4])
	const outputData = new Uint8ClampedArray(newWidth * newHeight * 4)
	const outDataArray = ndarray(outputData, [newHeight, newWidth, 4])
	for (let k = 0; k < 3; k++)
		for (let i = 0; i < newWidth; i++) {
			for (let j = 0; j < newHeight; j++) {
				let sum = 0
				let totalWeight = 0
				for (let s = Math.floor(j * scaleH); s < Math.ceil((j + 1) * scaleH); s++) {
					let overlap = Math.min((j + 1) * scaleH, s + 1) - Math.max(j * scaleH, s)
					if (overlap > 0) {
						sum += tempDataArray.get(s, i, k) * overlap
						totalWeight += overlap
					}
				}
				outDataArray.set(j, i, k, sum / totalWeight)
			}
		}
	for (let i = 0; i < newWidth; i++) {
		for (let j = 0; j < newHeight; j++) {
			outDataArray.set(j, i, 3, 255)
		}
	}
	return outDataArray

}

async function getPalette(
	paletteFile: File | undefined
) {
	const hexString = paletteFile
		? await paletteFile.text()
		: await (await fetch("./commodore64.hex")).text()
	const palette = hexString.trim().split(/\s+/).map(hex => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)])
	return palette
}

function closestPaletteColor(
	color: number[],
	palette: number[][]
) {
	let minDist = Infinity
	let best = 0
	for (let i = 0; i < palette.length; i++) {
		let dist = Math.pow(color[0] - palette[i][0], 2) + Math.pow(color[1] - palette[i][1], 2) + Math.pow(color[2] - palette[i][2], 2)
		if (dist < minDist) {
			best = i
			minDist = dist
		}
	}
	return palette[best]
}

function glyphCost(
	nfg: number,
	nbg: number,
	fgMean: number[],
	bgMean: number[],
	fgVar: number[],
	bgVar: number[],
	fgClosestPalCol: number[],
	bgClosestPalCol: number[]
) {
	let fgVarSum = fgVar.reduce((acc, num) => acc + num, 0)
	let bgVarSum = bgVar.reduce((acc, num) => acc + num, 0)
	let fgdist = Math.pow(fgMean[0] - fgClosestPalCol[0], 2) + Math.pow(fgMean[1] - fgClosestPalCol[1], 2) + Math.pow(fgMean[2] - fgClosestPalCol[2], 2)
	let bgdist = Math.pow(bgMean[0] - bgClosestPalCol[0], 2) + Math.pow(bgMean[1] - bgClosestPalCol[1], 2) + Math.pow(bgMean[2] - bgClosestPalCol[2], 2)
	let cost = fgVarSum + nfg * fgdist + bgVarSum + nbg * bgdist

	return cost
}

function glyphify(
	image: ndarray,
	dx: number,
	dy: number,
	glyphs: ndarray,
	palette: number[][]
) {
	let glyphStore = []
	for (let g = 0; g < glyphs.shape[0]; g++) {
		let fgMean = [0, 0, 0]
		let bgMean = [0, 0, 0]
		let fgVar = [0, 0, 0]
		let bgVar = [0, 0, 0]
		let nfg = 0
		let nbg = 0
		for (let k = 0; k < 3; k++) {
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					const tMean = image.get(dy + i, dx + j, k)
					const tVar = tMean * tMean
					if (glyphs.get(g, i, j) == 1) {
						fgMean[k] += tMean
						fgVar[k] += tVar
						nfg += 1
					}
					else {
						bgMean[k] += tMean
						bgVar[k] += tVar
						nbg += 1
					}
				}
			}
		}
		nfg = nfg / 3
		nbg = nbg / 3
		fgMean = fgMean.map(num => num / nfg)
		bgMean = bgMean.map(num => num / nbg)
		fgVar = fgVar.map((num, k) => num - (nfg * Math.pow(fgMean[k], 2)))
		bgVar = bgVar.map((num, k) => num - (nbg * Math.pow(bgMean[k], 2)))
		let fg = closestPaletteColor(fgMean, palette)
		let bg = closestPaletteColor(bgMean, palette)
		let cost = glyphCost(nfg, nbg, fgMean, bgMean, fgVar, bgVar, fg, bg)
		glyphStore.push([g, fg, bg, cost])
	}
	return glyphStore.reduce((a, b) => a[3] < b[3] ? a : b)
}

function render(
	prerender: (number | number[])[][],
	rows: number,
	cols: number,
	output: ndarray,
	glyphs: ndarray
) {
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			let currentGlyph = prerender[x + y * cols]
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
					for (let k = 0; k < 3; k++) {
						if (glyphs.get(currentGlyph[0], i, j) == 1)
							output.set(y * 8 + i, x * 8 + j, k, currentGlyph[1][k])
						else
							output.set(y * 8 + i, x * 8 + j, k, currentGlyph[2][k])
					}
				}
			}
		}
	}
}

export async function petsciify(
	input: File,
	paletteFile: File | undefined
): Promise<Blob> {
	const srcimg = await createImageBitmap(input);
	const sw = srcimg.width
	const sh = srcimg.height
	const srccanvas = new OffscreenCanvas(sw, sh)
	const srcctx = srccanvas.getContext("2d")!;
	srcctx.drawImage(srcimg, 0, 0, sw, sh);
	let srcData = srcctx.getImageData(0, 0, sw, sh)
	let srcDataArray = ndarray(srcData.data, [sh, sw, 4]);


	let glyphs = await getGlyphs()

	console.time("srgbtoLinear")
	srgbToLinear(srcDataArray)
	console.timeEnd("srgbtoLinear")

	const cols = 40
	const rows = Math.round(cols * sh / sw)
	const gh = 8, gw = 8
	console.time("downsample")
	let resizedDataArray = downsample(srcDataArray, rows * gh, cols * gw)
	console.timeEnd("downsample")

	console.time("linearToSrgb")
	linearToSrgb(resizedDataArray)
	console.timeEnd("linearToSrgb")

	const palette = await getPalette(paletteFile)
	let prerender = []
	const glyphtemp = glyphs.flat()
	let glyphArray = ndarray(glyphtemp, [glyphtemp.length / 64, 8, 8])

	console.time("match")
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			prerender.push(glyphify(resizedDataArray, x * gw, y * gh, glyphArray, palette))
		}
	}
	console.timeEnd("match")

	console.time("render")
	render(prerender, rows, cols, resizedDataArray, glyphArray)
	console.timeEnd("render")

	let outputCanvas = new OffscreenCanvas(cols * gw, rows * gh)
	let outputCtx = outputCanvas.getContext("2d")!
	const outputData = new ImageData(resizedDataArray.data, cols * gw, rows * gh)
	outputCtx.putImageData(outputData, 0, 0)

	return outputCanvas.convertToBlob({ type: "image/png" });
}
