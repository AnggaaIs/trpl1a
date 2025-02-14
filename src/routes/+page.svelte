<script lang="ts">
	import { writable } from "svelte/store";
	import type { ScheduleResponse } from "./api/data/$types";
	import { onMount } from "svelte";
	import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
	import { Alert } from "flowbite-svelte";
	import { MoonStar, CircleAlert, Pin } from "lucide-svelte";
	import { fly } from "svelte/transition";
	import Holidays from "date-holidays";

	const hd = new Holidays("ID");

	const data = writable<ScheduleResponse | null>(null);
	const isLoading = writable(true);
	const error = writable<string | null>(null);
	const now = writable(new Date());
	const ramadhanMessage = writable<string | null>(null);
	const isRamadhan = writable(false);
	const holidayMessage = writable<string | null>(null);
	const isHoliday = writable(false);

	const checkHoliday = async () => {
		const today = new Date();
		const isTodayHoliday = hd.isHoliday(today);

		if (isTodayHoliday) {
			isHoliday.set(true);
			holidayMessage.set(
				`🎉 Hari ini adalah hari libur nasional: <strong>${isTodayHoliday.map((x) => x.name).join(", ")}</strong>. Selamat menikmati hari libur!
			`
			);
		}
	};

	const checkRamadhan = async () => {
		const today = new Date();
		const day = today.getDate();
		const month = today.getMonth() + 1;
		const year = today.getFullYear();

		try {
			const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`);
			const data = await response.json();
			const hijri = data.data.hijri;

			if (hijri.month.number === 9) {
				isRamadhan.set(true);
				ramadhanMessage.set(`🌙 Selamat menjalankan ibadah puasa! Hari ke-${hijri.day} Ramadhan.`);
			} else {
				const ramadhanStart = new Date(today);
				ramadhanStart.setDate(today.getDate() + (29 - hijri.day));
				const daysUntilRamadhan = Math.ceil(
					(ramadhanStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
				);

				ramadhanMessage.set(
					`Waktu cepat banget berlalu... <strong>${daysUntilRamadhan}</strong> hari lagi Ramadhan tiba. Yuk, mulai persiapkan hati dan niat terbaik kita! 💫`
				);
			}
		} catch (error) {
			ramadhanMessage.set("❗ Gagal mendapatkan informasi Ramadhan.");
		}
	};

	onMount(async () => {
		await checkRamadhan();
		await checkHoliday();

		try {
			const res = await fetch(`/api/data?prodi=RPL&kelas=1A`);
			if (!res.ok) throw new Error("Gagal mengambil data");

			const result: ScheduleResponse = await res.json();
			data.set(result);
		} catch (err: any) {
			error.set(err.message);
		} finally {
			isLoading.set(false);
		}
	});

	setInterval(() => {
		now.set(new Date());
	}, 1000);

	const today = new Date().toLocaleDateString("id-ID", { weekday: "long" });

	let currentTime: string;
	now.subscribe((n) => {
		currentTime = n.toLocaleTimeString("en-US", { hour12: false, timeZone: "Asia/Jakarta" });
	});

	$: scheduleToday = $data?.data?.matkul?.[today] || [];
	$: validSchedule = scheduleToday.filter((matkul) => matkul.waktu?.start !== "00:00");
	$: finishedClasses = validSchedule.filter((matkul) => {
		const [endHour, endMinute] = matkul.waktu!.end.split(":").map(Number);
		const endTime = new Date();
		endTime.setHours(endHour, endMinute, 0);
		return $now > endTime;
	});
	$: allClassesFinished = $isHoliday || finishedClasses.length === validSchedule.length;

	$: currentClass = validSchedule.find((matkul) => {
		const [startHour, startMinute] = matkul.waktu!.start.split(":").map(Number);
		const [endHour, endMinute] = matkul.waktu!.end.split(":").map(Number);
		const startTime = new Date();
		startTime.setHours(startHour, startMinute, 0);
		const endTime = new Date();
		endTime.setHours(endHour, endMinute, 0);
		return $now >= startTime && $now <= endTime;
	});

	$: nextClass = validSchedule.find((matkul) => {
		const [hour, minute] = matkul.waktu!.start.split(":").map(Number);
		const classTime = new Date();
		classTime.setHours(hour, minute, 0);
		return classTime > $now;
	});

	function timeLeft(endTime: string) {
		const [hour, minute] = endTime.split(":").map(Number);
		const classEnd = new Date();
		classEnd.setHours(hour, minute, 0);
		const diff = classEnd.getTime() - $now.getTime();
		const minutesLeft = Math.floor(diff / 60000);
		const hours = Math.floor(minutesLeft / 60);
		const minutes = minutesLeft % 60;

		if (minutesLeft <= 0) return "Selesai";
		if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
		return `${minutes} menit lagi`;
	}

	function toProperCase(str: string) {
		return str.replace(
			/\w\S*/g,
			(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
		);
	}

	function formatedMatkul(matkul: string) {
		return matkul.replace(/\s*(PRAKTEK|TEORI|MKDU)$/i, "");
	}
</script>

<svelte:head>
	<title>AWAN | TRPL 1A</title>
	<meta name="description" content="Jadwal Mata Kuliah Hari Ini untuk TRPL 1A" />
</svelte:head>

{#if $ramadhanMessage}
	<Alert
		color="green"
		dismissable={$isRamadhan}
		border
		class="mx-auto mb-5 flex max-w-4xl items-center justify-between"
		transition={fly}
		params={{ y: -100, duration: 500 }}
		defaultClass="bg-green-100 dark:bg-background border-green-500 text-foreground p-4 gap-3 text-sm"
	>
		<div class="flex items-center gap-3">
			<MoonStar class="h-10 w-10 text-green-600 sm:h-6 sm:w-6 md:h-6 md:w-6 lg:h-6 lg:w-6" />
			<span>{@html $ramadhanMessage}</span>
		</div>
	</Alert>
{/if}

{#if $holidayMessage}
	<Alert
		color="blue"
		dismissable={$isHoliday}
		border
		class="mx-auto mb-5 flex max-w-4xl items-center justify-between"
		transition={fly}
		params={{ y: -100, duration: 500 }}
		defaultClass="bg-blue-100 dark:bg-background border-blue-500 text-foreground p-4 gap-3 text-sm"
	>
		<div class="flex items-center gap-3">
			<Pin class="h-10 w-10 text-blue-600 sm:h-6 sm:w-6 md:h-6 md:w-6 lg:h-6 lg:w-6" />
			<span>{@html $holidayMessage}</span>
		</div>
	</Alert>
{/if}

{#if !allClassesFinished}
	<Alert
		color="red"
		dismissable
		border
		class="mx-auto mb-5 flex max-w-4xl items-center justify-between"
		transition={fly}
		params={{ y: -100, duration: 500 }}
		defaultClass="bg-red-100 dark:bg-background border-red-500 text-foreground p-4 gap-3 text-sm"
	>
		<div class="flex items-center gap-3">
			<CircleAlert class="h-20 w-20 text-red-600 sm:h-10 sm:w-10 md:h-10 md:w-10 lg:h-10 lg:w-10" />
			<span>
				<strong>Perhatian!</strong> Semua data jadwal kuliah ini diperoleh secara otomatis dari
				sistem
				<a
					href="https://presensi.pnp.ac.id"
					target="_blank"
					rel="noopener noreferrer"
					class="font-semibold text-red-700 underline hover:text-red-800"
				>
					Presensi PNP
				</a>. Jika ada ketidaksesuaian atau perubahan jadwal, silakan konfirmasi langsung dengan
				pihak akademik atau dosen terkait. Terima kasih!
			</span>
		</div>
	</Alert>
{/if}

{#if $isLoading}
	<div class="min-h-screen w-full bg-background p-1 sm:p-4 md:p-6">
		<div class="mx-auto max-w-5xl space-y-6">
			<Skeleton class="h-8 w-2/3" />
			<Skeleton class="h-6 w-1/2" />
			<Skeleton class="h-6 w-1/3" />

			<div class="relative space-y-2 overflow-hidden rounded-xl border bg-accent p-6 shadow-md">
				<Skeleton class="h-6 w-1/3" />
				<Skeleton class="h-6 w-1/2" />
				<Skeleton class="h-5 w-2/3" />
				<Skeleton class="h-5 w-1/3" />
			</div>

			<div class="relative space-y-2 overflow-hidden rounded-xl border bg-accent p-6 shadow-md">
				<Skeleton class="h-6 w-1/3" />
				<Skeleton class="h-6 w-1/2" />
				<Skeleton class="h-5 w-2/3" />
				<Skeleton class="h-5 w-1/3" />
			</div>

			<Skeleton class="h-6 w-1/3 rounded-full" />
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each Array(4) as _, i}
					<div
						class="group relative space-y-2 overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-300"
					>
						<Skeleton class="h-6 w-2/3" />
						<Skeleton class="h-5 w-1/2" />
						<Skeleton class="h-5 w-2/3" />
						<Skeleton class="h-4 w-1/4 rounded-full" />
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else if $error}
	<div class="absolute inset-0 flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-7xl font-bold">😢</h1>
			<p class="mt-4 text-lg">Gagal memuat data</p>
			<p class="mt-2 text-sm text-muted-foreground">{$error}</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen w-full bg-background p-1 sm:p-4 md:p-6">
		<div class="mx-auto max-w-5xl space-y-6">
			{#if validSchedule.length > 0 && !allClassesFinished}
				<h1 class="text-3xl font-bold text-primary">📅 Jadwal Hari Ini ({today})</h1>
				<p class="text-lg text-muted-foreground">
					🕒 Waktu Sekarang: {currentTime}
				</p>
				<p class="text-md text-muted-foreground">
					📚 Total Mata Kuliah Hari Ini: {validSchedule.length}
				</p>
				<p class="text-md text-muted-foreground">
					✅ Mata Kuliah Selesai: {finishedClasses.length}
				</p>

				{#if currentClass}
					<div
						class="relative space-y-2 overflow-hidden rounded-xl border bg-secondary p-6 shadow-md ring-2 ring-primary"
					>
						<h2 class="text-2xl font-bold text-primary">⏳ Sedang Berlangsung</h2>
						<p class="text-lg font-medium">{formatedMatkul(currentClass.mata_kuliah.nama)}</p>
						<p class="text-sm text-muted-foreground">
							{currentClass.waktu!.start} - {currentClass.waktu!.end} | {currentClass.ruang}
						</p>
						<p class="text-md text-warning-foreground font-medium">
							🕒 {timeLeft(currentClass.waktu!.end)}
						</p>
						<p class="text-sm text-muted-foreground">
							👨‍🏫 {currentClass.dosen.map((x) => toProperCase(x)).join(", ")}
						</p>
					</div>
				{/if}

				{#if nextClass}
					<div class="relative space-y-2 overflow-hidden rounded-xl border bg-accent p-6 shadow-md">
						<h2 class="text-2xl font-bold text-primary">⏭️ Mata Kuliah Berikutnya</h2>
						<p class="text-lg font-medium">{formatedMatkul(nextClass.mata_kuliah.nama)}</p>
						<p class="text-sm text-muted-foreground">
							{nextClass.waktu!.start} - {nextClass.waktu!.end} | {nextClass.ruang}
						</p>
						<p class="text-md text-info-foreground font-medium">
							🕒 Dimulai dalam {timeLeft(nextClass.waktu!.start)}
						</p>
						<p class="text-sm text-muted-foreground">
							👨‍🏫 {nextClass.dosen.map((x) => toProperCase(x)).join(", ")}
						</p>
					</div>
				{/if}

				<div class="space-y-4">
					<h2 class="text-2xl font-semibold text-primary">📖 Jadwal Hari Ini</h2>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#each validSchedule as matkul}
							<div
								class="group relative space-y-2 overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-300 hover:scale-[1.02]"
							>
								<h3 class="text-lg font-semibold text-primary">
									{formatedMatkul(matkul.mata_kuliah.nama)}
								</h3>
								<p class="text-sm text-muted-foreground">
									🕒 {matkul.waktu!.start} - {matkul.waktu!.end} | 🏫 {matkul.ruang}
								</p>
								<p class="text-sm text-muted-foreground">
									👨‍🏫 {matkul.dosen.map((x) => toProperCase(x)).join(", ")}
								</p>
								<span
									class="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold"
									>🏷️ {matkul.jenis}</span
								>
							</div>
						{/each}
					</div>
				</div>
				{#if $data?.data.lastUpdate}
					<p class="text-center text-sm text-muted-foreground">
						Terakhir diperbarui: {new Date($data!.data.lastUpdate).toLocaleString("id-ID", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric"
						})}
					</p>
				{/if}
			{:else if allClassesFinished}
				<div class="flex flex-col items-center space-y-6 text-center">
					<div class="flex flex-col items-center gap-4 rounded-xl border-2 p-4 md:flex-row">
						<p class="text-lg font-medium text-muted-foreground">
							🗓️ {new Date().toLocaleDateString("id-ID", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric"
							})}
						</p>
						<span class="hidden text-muted-foreground md:block">•</span>
						<p class="text-lg font-medium text-muted-foreground">
							🕒 {currentTime}
						</p>
					</div>
					<p
						class="animate-fade-in bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-5xl font-extrabold text-transparent"
					>
						🎉 Selamat Istirahat!
					</p>
					<div class="w-16 border-t-4 border-primary"></div>
					<blockquote class="max-w-lg text-lg italic text-muted-foreground">
						"Anda memiliki kekuatan atas pikiran Anda, bukan atas peristiwa di luar diri Anda.
						Sadari ini, dan Anda akan menemukan kekuatan."
					</blockquote>
				</div>
			{/if}
		</div>
	</div>
{/if}
