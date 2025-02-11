import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const uri = new URL(url);
	const response = await fetch(`${uri.origin}/api/data`);
	const data = await response.json();
	return { data };
};
