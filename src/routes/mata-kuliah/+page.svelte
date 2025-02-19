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

	let selectedSemester = semesters[1].value;
</script>

<div class="flex flex-col items-center space-y-6 p-6">
	<h1 class="text-2xl font-bold">Mata Kuliah TRPL</h1>

	<Select.Root type="single" name="selectedSemester" bind:value={selectedSemester}>
		<Select.Trigger class="w-[200px] rounded-lg border p-2 text-center">
			{semesters.find((s) => s.value === selectedSemester)?.label ?? "Pilih Semester"}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.GroupHeading>Semester</Select.GroupHeading>
				{#each semesters as semester}
					<Select.Item value={semester.value} label={semester.label}>{semester.label}</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>

	<div class="w-full max-w-4xl overflow-x-auto">
		<Table.Root class="w-full">
			<Table.Caption>
				Daftar Mata Kuliah Semester {selectedSemester
					.replace("_", " ")
					.replace(/\b\w/g, (char) => char.toUpperCase())}
			</Table.Caption>
			<Table.Header>
				<Table.Row>
					<Table.Head>Kode</Table.Head>
					<Table.Head>Nama Mata Kuliah</Table.Head>
					<Table.Head>SKS</Table.Head>
					<Table.Head>Teori</Table.Head>
					<Table.Head>Praktik</Table.Head>
					<Table.Head>RPS</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data_matkul.akademik.trpl.matkul[selectedSemester] as matkul}
					<Table.Row>
						<Table.Cell class="font-medium">{matkul.kode}</Table.Cell>
						<Table.Cell>{matkul.nama}</Table.Cell>
						<Table.Cell>{matkul.sks.total}</Table.Cell>
						<Table.Cell>{matkul.jam.teori}</Table.Cell>
						<Table.Cell>{matkul.jam.praktek}</Table.Cell>
						<Table.Cell>
							{#if matkul.rps !== "#"}
								<a href={matkul.rps} target="_blank">Lihat</a>
							{:else}
								-
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
