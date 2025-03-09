import type { RequestHandler } from "@sveltejs/kit";
import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import type { MatkulDetil, ScheduleEntry, ScheduleResponse } from "./$types";

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
		ruang,
		online: ruang.endsWith("_B")
	};
};

const parseURL = (html: string) => {
	const $ = cheerio.load(html);
	//th
	const table = $("table");
	const rows = table.find("tr");
	let url = "";

	rows.each((i, el) => {
		const row = $(el);
		const cells = row.find("th, td");

		if ($(cells[1]).find("a").attr("href")?.includes("subgroups_days_horizontal")) {
			url = $(cells[1]).find("a").attr("href") ?? "";
		}
	});

	return url;
};

export const GET: RequestHandler = async ({ url: OriginURL }) => {
	const urlBase = "https://presensi.pnp.ac.id/ti/";

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
	const { data: html } = await axios.get(urlBase, { httpsAgent: agent });
	const updatedHtml = html.replaceAll("<!-- span -->", "<td>---</td>");

	const url =
		parseURL(updatedHtml) === ""
			? "https://presensi.pnp.ac.id/ti/TI%20Genap%202024-2025%20v1.3_subgroups_days_horizontal.html"
			: `${urlBase}${parseURL(updatedHtml)}`;

	const { data: updatedHtml2 } = await axios.get(url, { httpsAgent: agent });
	const updatedHtml2Fixed = updatedHtml2.replaceAll("<!-- span -->", "<td>---</td>");
	const semester: "Ganjil" | "Genap" = url.includes("Ganjil") ? "Ganjil" : "Genap";

	const $ = cheerio.load(updatedHtml2Fixed);
	let updatedTime: Date | null = null;

	function parseUpdate(text: string): Date | null {
		const t = text.split(" ");
		let date: Date | null = null;

		for (const i of t) {
			if (i.includes("/")) {
				const [day, month, year] = i.split("/").map(Number);
				const fullYear = year < 100 ? 2000 + year : year;
				date = new Date(fullYear, month - 1, day);
			}
		}

		return date;
	}

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

	const schedule: Record<string, ScheduleEntry[]> = {};
	const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

	const today = new Date();
	const day = today.getDate();
	const month = today.getMonth() + 1;
	const year = today.getFullYear();
	let isRamadhan = false;

	const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`);
	const data = await response.json();
	const hijri = data.data.hijri;

	if (hijri.month.number === 9) isRamadhan = true;

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
					date.setMinutes(date.getMinutes() + (isRamadhan ? 40 : 50));

					const currentHour = date.getHours();
					const currentMinute = date.getMinutes();

					if (currentHour === (isRamadhan ? 10 : 11) && currentMinute >= (isRamadhan ? 0 : 55)) {
						if (i + 1 === Number(rawSpan)) break;
						date.setHours(isRamadhan ? 10 : 13);
						date.setMinutes(isRamadhan ? 15 : 0);
					} else if (
						currentHour === (isRamadhan ? 12 : 15) &&
						currentMinute >= (isRamadhan ? 15 : 30)
					) {
						if (i + 1 === Number(rawSpan)) break;
						date.setHours(isRamadhan ? 12 : 15);
						date.setMinutes(45);
					}
				}

				const endTime = date.toTimeString().slice(0, 5);
				time = `${startTime} - ${endTime}`;
			}

			if (text !== "---") {
				const detil = $(cell).html()?.split("<br>") ?? [];

				if (detil[0].startsWith("Jadwal")) {
					updatedTime = parseUpdate(detil[0]);
				}

				const parsed = parseSchedule(detil);
				const { mata_kuliah, dosen, ruang, jenis, online } = parsed;

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
					jenis,
					online
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
				data: {
					matkul: schedule,
					lastUpdate: updatedTime,
					semester: semester
				}
			} as ScheduleResponse,
			null,
			2
		),
		{
			headers: { "Content-Type": "application/json" }
		}
	);
};
