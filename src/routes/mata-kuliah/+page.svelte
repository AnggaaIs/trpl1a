<script lang="ts">
	import * as Table from "$lib/components/ui/table/index";
	import * as Select from "$lib/components/ui/select/index";
	import { onMount } from "svelte";
	import { matkul } from "$lib/data/matkul";

	const data_matkul = matkul as any;

	const semesters = Object.keys(data_matkul.akademik.trpl.matkul).map((semester) => ({
		value: semester,
		label: semester.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
	}));

	let selectedSemester = semesters[2 - 1].value; //2 adalah semester sekarang

	$: matkulList = data_matkul.akademik.trpl.matkul[selectedSemester];

	$: totalSKS = matkulList.reduce((acc: number, matkul: any) => acc + matkul.sks.total, 0);
	$: totalSKSTeori = matkulList.reduce((acc: number, matkul: any) => acc + matkul.sks.teori, 0);
	$: totalSKSPraktik = matkulList.reduce((acc: number, matkul: any) => acc + matkul.sks.praktek, 0);
	$: totalJamTeori = matkulList.reduce((acc: number, matkul: any) => acc + matkul.jam.teori, 0);
	$: totalJamPraktik = matkulList.reduce((acc: number, matkul: any) => acc + matkul.jam.praktek, 0);
</script>

<svelte:head>
	<title>Mata Kuliah TRPL</title>
</svelte:head>

<div class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-center text-2xl font-bold">Mata Kuliah Teknologi Rekayasa Perangkat Lunak</h1>

	<Select.Root type="single" name="selectedSemester" bind:value={selectedSemester}>
		<Select.Trigger class="w-[200px] rounded-lg border p-2 text-center">
			{semesters.find((s) => s.value === selectedSemester)?.label ?? "Pilih Semester"}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				{#each semesters as semester}
					<Select.Item value={semester.value} label={semester.label}>{semester.label}</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>

	<div class="w-full max-w-4xl overflow-x-auto">
		<Table.Root class="border-radius-2 w-full border-separate rounded-sm border">
			<Table.Caption>
				Daftar Mata Kuliah {selectedSemester
					.replace("_", " ")
					.replace(/\b\w/g, (char) => char.toUpperCase())}
			</Table.Caption>
			<Table.Header>
				<Table.Row>
					<Table.Head>Kode</Table.Head>
					<Table.Head>Nama Mata Kuliah</Table.Head>
					<Table.Head>Jumlah SKS</Table.Head>
					<Table.Head>SKS Teori</Table.Head>
					<Table.Head>SKS Praktik</Table.Head>
					<Table.Head>Jam Teori</Table.Head>
					<Table.Head>Jam Praktek</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data_matkul.akademik.trpl.matkul[selectedSemester] as matkul}
					<Table.Row>
						<Table.Cell class="font-medium">{matkul.kode}</Table.Cell>
						<Table.Cell>{matkul.nama}</Table.Cell>
						<Table.Cell>{matkul.sks.total}</Table.Cell>
						<Table.Cell>{matkul.sks.teori}</Table.Cell>
						<Table.Cell>{matkul.sks.praktek}</Table.Cell>
						<Table.Cell>{matkul.jam.teori}</Table.Cell>
						<Table.Cell>{matkul.jam.praktek}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
			<Table.Footer>
				<Table.Row>
					<Table.Cell colspan={2} class="text-center font-bold">Total</Table.Cell>
					<Table.Cell class="font-bold">{totalSKS}</Table.Cell>
					<Table.Cell class="font-bold">{totalSKSTeori}</Table.Cell>
					<Table.Cell class="font-bold">{totalSKSPraktik}</Table.Cell>
					<Table.Cell class="font-bold">{totalJamTeori}</Table.Cell>
					<Table.Cell class="font-bold">{totalJamPraktik}</Table.Cell>
				</Table.Row>
			</Table.Footer>
		</Table.Root>
	</div>
</div>
