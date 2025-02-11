<script lang="ts">
	import '@fontsource-variable/outfit';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import '../app.css';
	import { MoonIcon, SunIcon } from 'lucide-svelte';
	let { children } = $props();
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
				<SunIcon
					class="h- block h-4 w-4 rotate-0 scale-100 transition-all dark:hidden dark:-rotate-90 dark:scale-0"
				/>
				<MoonIcon
					class="hidden h-4 w-4 rotate-90 scale-0 transition-all dark:block dark:rotate-0 dark:scale-100"
				/>

				<span class="sr-only">Toggle Theme</span>
			</Button>
		</div>
	</div>
</div>

<div class="flex min-h-[100vh] justify-center px-7 pt-20">
	<div class="w-full max-w-[85rem]">
		<ModeWatcher />
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		font-family: 'Outfit', sans-serif;
	}
</style>
