<script lang="ts">
	import { ModeWatcher, toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button";
	import "../app.css";
	let { children } = $props();
	import { MoonIcon, SunIcon } from "lucide-svelte";
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
		<ModeWatcher track={false} defaultMode={"dark"} />
		{@render children()}
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
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Formulated in</span>
		<a href="https://svelte.dev" class="text-sky-500 hover:underline">svelte</a>,
		<a href="https://tailwindcss.com" class="text-teal-500 hover:underline">tailwindcss</a>, and
		<a href="https://ui.shadcn.com" class="text-purple-500 hover:underline">shadcn/ui</a>.
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		Follow us on
		<a href="https://instagram.com/aonetrpl24" class="text-pink-500 hover:underline">
			Instagram @aonetrpl24
		</a>
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		Source code available on
		<a href="https://github.com/AnggaaIs/trpl1a" class="text-green-500 hover:underline">
			GitHub
		</a>.
	</div>
</footer>
