export async function getGlyphs() {
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
