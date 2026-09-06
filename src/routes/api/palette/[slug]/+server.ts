import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, fetch }) => {
	const response = await fetch(
		`https://lospec.com/palette-list/${encodeURIComponent(params.slug)}.hex`
	);

	if (!response.ok) error(response.status, "Palette not found");

	const text = await response.text();
	return new Response(text, {
		headers: { "content-type": "text/plain" }
	});
};
