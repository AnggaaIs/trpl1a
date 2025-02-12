/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { files, version } from "$service-worker";

const CACHE = `aone-cache-${version}`;
const ASSETS = [...files];

sw.addEventListener("install", (event) => {
	async function addToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
		await sw.skipWaiting();
	}
	event.waitUntil(addToCache());
});

sw.addEventListener("activate", (event) => {
	async function clearOldCache() {
		const keys = await caches.keys();
		await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
		await sw.clients.claim();
	}
	event.waitUntil(clearOldCache());
});

sw.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			return (
				cachedResponse ||
				fetch(event.request).catch(async () => {
					if (event.request.mode === "navigate") {
						const offlineResponse = await caches.match("/offline.html");
						if (offlineResponse) {
							return offlineResponse;
						}
					}
					return new Response("Service Unavailable", { status: 503 });
				})
			);
		})
	);
});
