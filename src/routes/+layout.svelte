<script lang="ts">
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import '../app.css';
	import { MoonIcon, SunIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js', {
					type: dev ? 'module' : 'classic'
				})
				.then((registration) => {
					console.log('Service Worker terdaftar');
				})
				.catch((error) => {
					console.error('Pendaftaran Service Worker gagal');
				});
		}
	});
</script>

<div
	class="navbar fixed z-[9999999] flex w-full items-center justify-center px-5 py-3 backdrop-blur-sm"
>
	<div class="flex w-full max-w-6xl items-center">
		<div class="flex-1">
			<a href="/" class="text-xl font-bold">TRPL 1A</a>
		</div>
		<div class="flex">
			<Button
				onclick={toggleMode}
				variant="outline"
				class="flex items-center justify-center"
				size="icon"
			>
				<SunIcon class="h-4 w-4 dark:hidden" />
				<MoonIcon class="hidden h-4 w-4 dark:block" />
				<span class="sr-only">Toggle Theme</span>
			</Button>
		</div>
	</div>
</div>

<div class="flex min-h-[100vh] justify-center px-7 pt-20">
	<div class="w-full max-w-[85rem]">
		<ModeWatcher />
		<slot />
	</div>
</div>

<footer
	class="mt-10 flex w-full flex-col items-center justify-center border-t px-5 py-6 text-center backdrop-blur-sm"
>
	<div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Made by</span>
		<span class="text-red-500">❤️</span>
		<span>for</span>
		<span class="text-blue-500">AWAN ☁️</span>
	</div>
</footer>
