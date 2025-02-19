<script lang="ts">
	import { ModeWatcher, toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button";
	import "../app.css";
	let { children } = $props();
	import { MenuIcon, MoonIcon, SunIcon } from "lucide-svelte";
	import * as Sheet from "$lib/components/ui/sheet";
	import { page } from "$app/state";

	let isOpen = $state(false);

	function closeSheet() {
		$: isOpen = false;
	}

	function isActive(path: string) {
		return page.url.pathname === path
			? "text-gray-900 dark:text-gray-50 font-bold"
			: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50";
	}
</script>

<header class="sticky top-0 z-50 w-full border-b py-3 backdrop-blur-sm">
	<div class="container mx-auto flex h-10 max-w-6xl items-center justify-between px-4">
		<div class="flex items-center gap-2">
			<a href="/" class="text-xl font-bold">TRPL 1A</a>
		</div>
		<nav class="hidden items-center gap-6 text-sm font-medium md:flex">
			<a href="/" class={isActive("/")}>Home</a>
			<a href="/mata-kuliah" class={isActive("/mata-kuliah")}>Mata Kuliah</a>
		</nav>
		<div class="flex items-center gap-4">
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
			<Sheet.Root bind:open={isOpen}>
				<Sheet.Trigger>
					<Button size="icon" variant="outline" class="flex items-center justify-center md:hidden">
						<MenuIcon class="h-5 w-5" />
						<span class="sr-only">Toggle navigation menu</span>
					</Button>
				</Sheet.Trigger>

				<Sheet.Content side="left" class="md:hidden">
					<Sheet.Header>
						<Sheet.Title>Menu</Sheet.Title>
					</Sheet.Header>
					<div class="grid gap-4 p-4">
						<a href="/" class={isActive("/")} onclick={closeSheet}>Home</a>
						<a href="/mata-kuliah" class={isActive("/mata-kuliah")} onclick={closeSheet}
							>Mata Kuliah</a
						>
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>

<div class="flex min-h-[100vh] justify-center px-7 pt-10">
	<div class="w-full max-w-[85rem]">
		<ModeWatcher track={false} defaultMode={"dark"} />
		{@render children()}
	</div>
</div>

<footer
	class="mt-10 flex w-full flex-col items-center justify-center border-t px-5 py-6 text-center backdrop-blur-sm"
>
	<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Made by</span>
		<span class="text-red-500">❤️</span>
		<span>for</span>
		<span class="text-blue-500">AWAN ☁️</span>
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		<span>Formulated in</span>
		<a href="https://svelte.dev" target="_blank" class="text-sky-500 hover:underline">svelte</a>,
		<a href="https://tailwindcss.com" target="_blank" class="text-teal-500 hover:underline"
			>tailwindcss</a
		>, and
		<a href="https://ui.shadcn.com" target="_blank" class="text-purple-500 hover:underline"
			>shadcn/ui</a
		>.
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		Follow us on
		<a
			href="https://instagram.com/aonetrpl24"
			target="_blank"
			class="text-pink-500 hover:underline"
		>
			Instagram @aonetrpl24
		</a>
	</div>
	<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
		Source code available on
		<a
			href="https://github.com/AnggaaIs/trpl1a"
			target="_blank"
			class="text-green-500 hover:underline"
		>
			GitHub
		</a>.
	</div>
</footer>
