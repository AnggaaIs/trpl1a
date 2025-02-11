<script lang="ts">
	import type { PageProps } from './$types';
	import type { ScheduleResponse } from './api/data/$types';

	let { data: d }: PageProps = $props();
	const { data } = d.data as ScheduleResponse;

	const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

	let now = new Date();
	let currentTime = $state(now);

	setInterval(() => {
		now = new Date();
		currentTime = now;
	}, 1000);

	const scheduleToday = data[today] || [];
	const validSchedule = scheduleToday.filter((matkul) => matkul.waktu!.start !== '00:00');

	let currentClass = validSchedule.find((matkul) => {
		const [startHour, startMinute] = matkul.waktu!.start.split(':').map(Number);
		const [endHour, endMinute] = matkul.waktu!.end.split(':').map(Number);
		const startTime = new Date();
		startTime.setHours(startHour, startMinute, 0);
		const endTime = new Date();
		endTime.setHours(endHour, endMinute, 0);
		return now >= startTime && now <= endTime;
	});

	let nextClass = validSchedule.find((matkul) => {
		const [hour, minute] = matkul.waktu!.start.split(':').map(Number);
		const classTime = new Date();
		classTime.setHours(hour, minute, 0);
		return classTime > now;
	});

	const finishedClasses = validSchedule.filter((matkul) => {
		const [endHour, endMinute] = matkul.waktu!.end.split(':').map(Number);
		const endTime = new Date();
		endTime.setHours(endHour, endMinute, 0);
		return now > endTime;
	});

	const allClassesFinished = finishedClasses.length === validSchedule.length;

	function timeLeft(endTime: string) {
		const [hour, minute] = endTime.split(':').map(Number);
		const classEnd = new Date();
		classEnd.setHours(hour, minute, 0);

		const diff = classEnd.getTime() - now.getTime();
		const minutesLeft = Math.floor(diff / 60000);
		const hours = Math.floor(minutesLeft / 60);
		const minutes = minutesLeft % 60;

		if (minutesLeft <= 0) return 'Selesai';
		if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
		return `${minutes} menit lagi`;
	}
</script>

<svelte:head>
	<title>Jadwal Hari Ini</title>
</svelte:head>

<div class="min-h-screen w-full bg-background p-1 sm:p-4 md:p-6">
	<div class="mx-auto max-w-5xl space-y-6">
		<h1 class="text-3xl font-bold text-primary">📅 Jadwal Hari Ini ({today})</h1>
		<p class="text-lg text-muted-foreground">
			🕒 Waktu Sekarang: {currentTime.toLocaleTimeString()}
		</p>
		<p class="text-md text-muted-foreground">
			📚 Total Mata Kuliah Hari Ini: {validSchedule.length}
		</p>
		<p class="text-md text-muted-foreground">✅ Mata Kuliah Selesai: {finishedClasses.length}</p>

		{#if currentClass}
			<div
				class="relative space-y-2 overflow-hidden rounded-xl border bg-secondary p-6 shadow-md ring-2 ring-primary"
			>
				<h2 class="text-2xl font-bold text-primary">⏳ Sedang Berlangsung</h2>
				<p class="text-lg font-medium">{currentClass.mata_kuliah.nama}</p>
				<p class="text-sm text-muted-foreground">
					{currentClass.waktu!.start} - {currentClass.waktu!.end} | {currentClass.ruang}
				</p>
				<p class="text-md text-warning-foreground font-medium">
					🕒 {timeLeft(currentClass.waktu!.end)}
				</p>
				<p class="text-xs text-muted-foreground">👨‍🏫 {currentClass.dosen.join(', ')}</p>
			</div>
		{/if}

		{#if nextClass}
			<div class="relative space-y-2 overflow-hidden rounded-xl border bg-accent p-6 shadow-md">
				<h2 class="text-2xl font-bold text-primary">⏭️ Mata Kuliah Berikutnya</h2>
				<p class="text-lg font-medium">{nextClass.mata_kuliah.nama}</p>
				<p class="text-sm text-muted-foreground">
					{nextClass.waktu!.start} - {nextClass.waktu!.end} | {nextClass.ruang}
				</p>
				<p class="text-md text-info-foreground font-medium">
					🕒 Dimulai dalam {timeLeft(nextClass.waktu!.start)}
				</p>
				<p class="text-xs text-muted-foreground">👨‍🏫 {nextClass.dosen.join(', ')}</p>
			</div>
		{/if}

		{#if validSchedule.length > 0}
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold text-primary">📖 Jadwal Hari Ini</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each validSchedule as matkul}
						<div
							class="group relative space-y-2 overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-300 hover:scale-[1.02]"
						>
							<h3 class="text-lg font-semibold text-primary">{matkul.mata_kuliah.nama}</h3>
							<p class="text-sm text-muted-foreground">
								🕒 {matkul.waktu!.start} - {matkul.waktu!.end} | 🏫 {matkul.ruang}
							</p>
							<p class="text-xs text-muted-foreground">👨‍🏫 {matkul.dosen.join(', ')}</p>
							<span class="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold"
								>🏷️ {matkul.jenis}</span
							>
						</div>
					{/each}
				</div>
			</div>
		{:else if allClassesFinished}
			<p class="text-success mt-4 text-center text-2xl font-bold">🎉 Selamat Istirahat!</p>
		{/if}
	</div>
</div>
