<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";

	let error = {
		statusCode: 404,
		message: "Halaman tidak ditemukan"
	};

	switch (page.status) {
		case 404:
			error.statusCode = 404;
			error.message = "Halaman tidak ditemukan";
			break;
		case 500:
			error.statusCode = 500;
			error.message = "Terjadi kesalahan pada server";
			break;
	}
</script>

<svelte:head>
	<title>{error.statusCode} - {error.message}</title>
	<meta name="description" content={error.message} />
</svelte:head>

<main class="absolute inset-0 flex items-center justify-center p-6">
	<div class="text-center">
		<h1 class="text-7xl font-bold">{error.statusCode}</h1>
		<p class="mt-4 text-lg">{error.message}</p>
		<Button href="/" class="mt-6">Kembali ke Beranda</Button>
	</div>
</main>
