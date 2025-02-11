<script lang="ts">
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

<footer
	class="mt-10 flex w-full flex-col items-center justify-center border-t px-5 py-6 text-center backdrop-blur-sm"
>
	<div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Made by</span>
		<span class="text-red-500">❤️</span>
		<span>to</span>
		<span class="text-blue-500">AWAN ☁️</span>
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Formulated in</span>
		<a href="https://svelte.dev" class="text-sky-500 hover:underline">svelte</a>,
		<a href="https://tailwindcss.com" class="text-teal-500 hover:underline">tailwindcss</a>, and
		<a href="https://ui.shadcn.com" class="text-purple-500 hover:underline">shadcn/ui</a>.
	</div>

	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		Follow us on <a href="https://instagram.com/aonetrpl24" class="text-pink-500 hover:underline"
			>Instagram @aonetrpl24</a
		>
	</div>
</footer>
