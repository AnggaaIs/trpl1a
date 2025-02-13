import type { RequestHandler } from "@sveltejs/kit";
import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import type { MatkulDetil, ScheduleEntry } from "./$types";

const validKelasRegex = /^[1-4][A-Da-d]$/;
const validProdi = [
	{
		name: "Teknologi Rekayasa Perangkat Lunak",
		kode: "RPL"
	},
	{
		name: "Manajemen Informatika",
		kode: "MI"
	},
	{
		name: "Teknik Komputer",
		kode: "TK"
	},
	{
		name: "Animasi",
		kode: "ANM"
	}
];

const parseSchedule = (detil: string[]): ScheduleEntry => {
	if (detil.length < 4) {
		return { mata_kuliah: { kode: "-", nama: "-" }, jenis: "MKDU", dosen: [], ruang: "-" };
	}

	if (detil.length === 5 && detil[4] === "") {
		detil = detil.slice(0, 4);
	}

	const kelas = detil[0];
	let matkul = detil[1];
	const kode_matkul = matkul.split(" ")[0];
	matkul = matkul.replace(kode_matkul, "").trim();
	const dosen = detil[2].split(", ");
	const ruang = detil[3];

	let jenis: "Praktek" | "Teori" | "MKDU" = matkul.endsWith("PRAKTEK")
		? "Praktek"
		: matkul.endsWith("TEORI")
			? "Teori"
			: "MKDU";

	return {
		mata_kuliah: {
			kode: kode_matkul,
			nama: matkul
		},
		jenis,
		dosen,
		ruang
	};
};

export const GET: RequestHandler = async ({ url: OriginURL }) => {
	const url =
		"https://presensi.pnp.ac.id/ti/TI%20Ganjil%202024-2025%20noAK%20v1.1_subgroups_days_horizontal.html";

	const kelas = OriginURL.searchParams.get("kelas");
	const prodi = OriginURL.searchParams.get("prodi");

	if (
		!kelas ||
		!prodi ||
		!validKelasRegex.test(kelas.toLowerCase()) ||
		!validProdi.some((p) => p.kode.toLowerCase() === prodi.toLowerCase())
	) {
		return new Response(
			JSON.stringify(
				{
					statusCode: 400,
					message: "Invalid Parameter",
					details: {
						kelas: "Kelas dimulai dengan angka lalu diikuti huruf, misal 1A",
						dataProdi: validProdi
					}
				},
				null,
				2
			),
			{
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	const agent = new https.Agent({ rejectUnauthorized: false });
	const { data: html } = await axios.get(url, { httpsAgent: agent });
	const updatedHtml = html.replaceAll("<!-- span -->", "<td>---</td>");
	const $ = cheerio.load(updatedHtml);

	function getTableNumber(programCode: string, classCode: string) {
		programCode = programCode.toUpperCase();
		classCode = classCode.toUpperCase();
		const regex = new RegExp(`\\d*${programCode}-${classCode}-REGULER Grup Otomat`);
		const link = $("a")
			.filter((i, el) => regex.test($(el).text()))
			.attr("href");

		if (link) {
			const match = link.match(/#table_(\d+)/);
			return match ? match[1] : null;
		}
		return null;
	}

	const tableNumber = getTableNumber(prodi, kelas);
	if (!tableNumber) {
		return new Response(
			JSON.stringify({ statusCode: 404, message: "Not Found", data: null }, null, 2),
			{
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	const table = $(`#table_${tableNumber}`);

	const schedule: Record<
		string,
		{
			waktu: {
				start: string;
				end: string;
				durasi: number;
			};
			mata_kuliah: MatkulDetil;
			dosen: string[];
			ruang: string;
			jenis: string;
		}[]
	> = {};
	const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

	for (const day of days) {
		schedule[day] = [
			{
				waktu: {
					start: "00:00",
					end: "00:00",
					durasi: 0
				},
				mata_kuliah: { nama: "-", kode: "-" },
				dosen: [],
				ruang: "-",
				jenis: "Libur"
			}
		];
	}

	table.find("tr").each((rowIndex, row) => {
		if (rowIndex === 0) return;
		const cells = $(row).find("td, th");

		cells.each((cellIndex, cell) => {
			if (cellIndex === 0) return;
			let day = days[cellIndex - 1];
			const text = $(cell).text().trim();
			const rawSpan = cell.attribs.rowspan ?? 1;

			let time = $(cells[0]).text();

			if (rawSpan) {
				const startTime = time.split(" - ")[0];
				const [hours, minutes] = startTime.split(":").map(Number);

				let date = new Date();
				date.setHours(hours);
				date.setMinutes(minutes);

				for (let i = 0; i < Number(rawSpan); i++) {
					date.setMinutes(date.getMinutes() + 50);

					const currentHour = date.getHours();
					const currentMinute = date.getMinutes();

					if (currentHour === 11 && currentMinute >= 55) {
						if (i + 1 === Number(rawSpan)) break;
						date.setHours(13);
						date.setMinutes(0);
					} else if (currentHour === 15 && currentMinute >= 30) {
						if (i + 1 === Number(rawSpan)) break;
						date.setHours(15);
						date.setMinutes(45);
					}
				}

				const endTime = date.toTimeString().slice(0, 5);
				time = `${startTime} - ${endTime}`;
			}

			if (text !== "---") {
				const detil = $(cell).html()?.split("<br>") ?? [];

				const parsed = parseSchedule(detil);
				const { mata_kuliah, dosen, ruang, jenis } = parsed;

				if (mata_kuliah.kode === "-") return;

				if (schedule[day].length === 1 && schedule[day][0].mata_kuliah.kode === "-") {
					schedule[day] = [];
				}

				const same = schedule[day].find((entry) => entry.mata_kuliah.kode === mata_kuliah.kode);
				if (same) return;

				schedule[day].push({
					waktu: {
						start: time.split(" - ")[0],
						end: time.split(" - ")[1],
						durasi: Number(rawSpan)
					},
					mata_kuliah,
					dosen,
					ruang,
					jenis
				});
			}
		});
	});

	return new Response(
		JSON.stringify(
			{
				statusCode: 200,
				message: "SUCCESS",
				kalas: {
					prodi: validProdi.find((p) => p.kode.toLowerCase() === prodi.toLowerCase())?.name,
					kelas: kelas.toUpperCase()
				},
				data: schedule
			},
			null,
			2
		),
		{
			headers: { "Content-Type": "application/json" }
		}
	);
};
