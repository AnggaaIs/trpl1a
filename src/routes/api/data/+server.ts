import type { RequestHandler } from "@sveltejs/kit";
import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import type { ScheduleEntry, ScheduleResponse } from "./$types";

const URL_BASE = "https://presensi.pnp.ac.id/ti/";
const DEFAULT_SCHEDULE_URL = "TI%20Genap%202024-2025%20v1.3_subgroups_days_horizontal.html";
const VALID_KELAS_REGEX = /^[1-4][A-Da-d]$/i;
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const VALID_PRODI = [
	{ name: "Teknologi Rekayasa Perangkat Lunak", kode: "RPL" },
	{ name: "Manajemen Informatika", kode: "MI" },
	{ name: "Teknik Komputer", kode: "TK" },
	{ name: "Animasi", kode: "ANM" }
];

const requestCache = new Map<string, any>();

const TIME_SCHEDULES = {
	regular: {
		calculateTime: (
			startTime: string,
			periods: number
		): { start: string; end: string; durasi: number } => {
			const [hours, minutes] = startTime.split(":").map(Number);
			const date = new Date();
			date.setHours(hours, minutes);

			let totalDuration = 0;
			for (let i = 0; i < periods; i++) {
				date.setMinutes(date.getMinutes() + 50);
				totalDuration += 50;

				const currentHour = date.getHours();
				const currentMinute = date.getMinutes();

				if (currentHour === 11 && currentMinute >= 55) {
					if (i + 1 === periods) break;
					date.setHours(13, 0);
				} else if (currentHour === 15 && currentMinute >= 30) {
					if (i + 1 === periods) break;
					date.setHours(15, 45);
				}
			}

			return {
				start: startTime,
				end: date.toTimeString().slice(0, 5),
				durasi: periods
			};
		}
	},

	ramadhan: {
		periods: {
			"Senin-Kamis": [
				{ period: "I", start: "08:00", end: "08:40", duration: 40 },
				{ period: "II", start: "08:40", end: "09:20", duration: 40 },
				{ period: "III", start: "09:20", end: "10:00", duration: 40 },
				{ period: "Istirahat", start: "10:00", end: "10:15", duration: 15 },
				{ period: "IV", start: "10:15", end: "10:55", duration: 40 },
				{ period: "V", start: "10:55", end: "11:35", duration: 40 },
				{ period: "VI", start: "11:35", end: "12:15", duration: 40 },
				{ period: "Istirahat", start: "12:15", end: "12:45", duration: 30 },
				{ period: "VII", start: "12:45", end: "13:25", duration: 40 },
				{ period: "VIII", start: "13:25", end: "14:05", duration: 40 },
				{ period: "IX", start: "14:05", end: "14:45", duration: 40 },
				{ period: "X", start: "14:45", end: "15:25", duration: 40 }
			],
			Jumat: [
				{ period: "I", start: "08:00", end: "08:40", duration: 40 },
				{ period: "II", start: "08:40", end: "09:20", duration: 40 },
				{ period: "III", start: "09:20", end: "10:00", duration: 40 },
				{ period: "Istirahat", start: "10:00", end: "10:15", duration: 15 },
				{ period: "IV", start: "10:15", end: "10:55", duration: 40 },
				{ period: "V", start: "10:55", end: "11:35", duration: 40 },
				{ period: "VI", start: "11:35", end: "12:15", duration: 40 },
				{ period: "Istirahat", start: "12:15", end: "13:30", duration: 75 },
				{ period: "VII", start: "13:30", end: "14:10", duration: 40 },
				{ period: "VIII", start: "14:10", end: "14:50", duration: 40 },
				{ period: "IX", start: "14:50", end: "15:30", duration: 40 },
				{ period: "X", start: "15:30", end: "16:10", duration: 40 }
			]
		},

		getSchedule: (() => {
			const cache = new Map();

			return (
				period: number,
				totalPeriods: number,
				day: string
			): { start: string; end: string; durasi: number } => {
				const cacheKey = `${period}-${totalPeriods}-${day}`;
				if (cache.has(cacheKey)) return cache.get(cacheKey);

				const schedule =
					day === "Jumat"
						? TIME_SCHEDULES.ramadhan.periods["Jumat"]
						: TIME_SCHEDULES.ramadhan.periods["Senin-Kamis"];

				const periodIndices = schedule
					.map((item, idx) => (!item.period.includes("Istirahat") ? idx : -1))
					.filter((idx) => idx !== -1);

				if (period > periodIndices.length) {
					return { start: "00:00", end: "00:00", durasi: 0 };
				}

				const startIdx = periodIndices[period - 1];
				const endPeriodIdx = Math.min(period - 1 + totalPeriods - 1, periodIndices.length - 1);
				const endIdx = periodIndices[endPeriodIdx];

				let totalDuration = 0;
				for (let i = period - 1; i <= endPeriodIdx; i++) {
					const idx = periodIndices[i];
					if (idx !== undefined) {
						totalDuration += schedule[idx].duration;
					}
				}

				const result = {
					start: schedule[startIdx].start,
					end: schedule[endIdx].end,
					durasi: totalDuration
				};

				cache.set(cacheKey, result);
				return result;
			};
		})()
	}
};

const parseScheduleEntry = (() => {
	const cache = new Map<string, ScheduleEntry>();

	return (detil: string[]): ScheduleEntry => {
		const cacheKey = detil.join("|");
		if (cache.has(cacheKey)) return cache.get(cacheKey)!;

		if (detil.length < 4) {
			return { mata_kuliah: { kode: "-", nama: "-" }, jenis: "MKDU", dosen: [], ruang: "-" };
		}

		if (detil.length === 5 && detil[4] === "") {
			detil = detil.slice(0, 4);
		}

		const kodeMatkul = detil[1].split(" ")[0];
		const matkul = detil[1].replace(kodeMatkul, "").trim();
		const dosen = detil[2].split(", ");
		const ruang = detil[3];

		let jenis: "Praktek" | "Teori" | "MKDU";
		if (matkul.endsWith("PRAKTEK")) jenis = "Praktek";
		else if (matkul.endsWith("TEORI")) jenis = "Teori";
		else jenis = "MKDU";

		const result = {
			mata_kuliah: {
				kode: kodeMatkul,
				nama: matkul
			},
			jenis,
			dosen,
			ruang,
			online: ruang.endsWith("_B")
		};

		cache.set(cacheKey, result);
		return result;
	};
})();

async function cachedFetch(url: string, options?: any): Promise<any> {
	if (requestCache.has(url)) return requestCache.get(url);

	const agent = new https.Agent({ rejectUnauthorized: false });
	const { data } = await axios.get(url, { httpsAgent: agent, ...options });
	const cleanData =
		typeof data === "string" ? data.replaceAll("<!-- span -->", "<td>---</td>") : data;

	requestCache.set(url, cleanData);
	return cleanData;
}

const isRamadhanMonth = (() => {
	let cachedResult: boolean | null = null;
	let cacheDate: string | null = null;

	return async (): Promise<boolean> => {
		const today = new Date();
		const dateKey = `${today.getDate()}-${today.getMonth()}-${today.getFullYear()}`;

		if (cacheDate === dateKey && cachedResult !== null) {
			return cachedResult;
		}

		try {
			const { data } = await axios.get(
				`https://api.aladhan.com/v1/gToH?date=${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
			);

			cachedResult = data.data.hijri.month.number === 9;
			cacheDate = dateKey;
			return cachedResult;
		} catch (error) {
			console.error("Error checking Ramadhan:", error);
			return false;
		}
	};
})();

export const GET: RequestHandler = async ({ url: OriginURL }) => {
	const kelas = OriginURL.searchParams.get("kelas")?.toLowerCase();
	const prodi = OriginURL.searchParams.get("prodi")?.toLowerCase();

	if (
		!kelas ||
		!prodi ||
		!VALID_KELAS_REGEX.test(kelas) ||
		!VALID_PRODI.some((p) => p.kode.toLowerCase() === prodi)
	) {
		return new Response(
			JSON.stringify(
				{
					statusCode: 400,
					message: "Invalid Parameter",
					details: {
						kelas: "Kelas dimulai dengan angka lalu diikuti huruf, misal 1A",
						dataProdi: VALID_PRODI
					}
				},
				null,
				2
			),
			{ headers: { "Content-Type": "application/json" } }
		);
	}

	try {
		const html = await cachedFetch(URL_BASE);

		const $ = cheerio.load(html);
		const scheduleUrl =
			$("table tr")
				.find("th, td")
				.find("a[href*='subgroups_days_horizontal']")
				.first()
				.attr("href") || DEFAULT_SCHEDULE_URL;

		const fullScheduleUrl = scheduleUrl.startsWith("http")
			? scheduleUrl
			: `${URL_BASE}${scheduleUrl}`;
		const semester: "Ganjil" | "Genap" = fullScheduleUrl.includes("Ganjil") ? "Ganjil" : "Genap";

		const scheduleHtml = await cachedFetch(fullScheduleUrl);
		const $schedule = cheerio.load(scheduleHtml);

		const regex = new RegExp(
			`\\d*${prodi.toUpperCase()}-${kelas.toUpperCase()}-REGULER Grup Otomat`
		);
		const tableLink = $schedule("a")
			.filter((_, el) => regex.test($schedule(el).text()))
			.attr("href");

		const tableNumber = tableLink?.match(/#table_(\d+)/)?.[1];

		if (!tableNumber) {
			return new Response(
				JSON.stringify({ statusCode: 404, message: "Not Found", data: null }, null, 2),
				{ headers: { "Content-Type": "application/json" } }
			);
		}

		const isRamadhan = await isRamadhanMonth();

		const schedule: Record<string, Array<ScheduleEntry>> = Object.fromEntries(
			DAYS.map((day) => [
				day,
				[
					{
						waktu: { start: "00:00", end: "00:00", durasi: 0 },
						mata_kuliah: { nama: "-", kode: "-" },
						dosen: [] as string[],
						ruang: "-",
						jenis: "Libur" as const
					}
				]
			])
		);

		let updatedTime: Date | null = null;

		const table = $schedule(`#table_${tableNumber}`);
		const rows = table.find("tr");

		const rowIndices = Array.from({ length: rows.length }, (_, i) => i).slice(1);

		for (const rowIndex of rowIndices) {
			const row = rows.eq(rowIndex);
			const cells = row.find("td, th");
			const periodNumber = rowIndex;
			const baseTime = cells.eq(0).text();

			for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
				const cellIndex = dayIndex + 1;
				const cell = cells.eq(cellIndex);
				if (!cell.length) continue;

				const day = DAYS[dayIndex];
				const text = cell.text().trim();
				const rawSpan = parseInt(cell.attr("rowspan") || "1");

				if (text === "---") continue;

				const timeInfo = isRamadhan
					? TIME_SCHEDULES.ramadhan.getSchedule(periodNumber, rawSpan, day)
					: TIME_SCHEDULES.regular.calculateTime(baseTime.split(" - ")[0], rawSpan);

				timeInfo.durasi = rawSpan;

				const detil = cell.html()?.split("<br>") || [];

				if (detil[0] && detil[0].startsWith("Jadwal")) {
					const parts = detil[0].split(" ");
					for (const part of parts) {
						if (part.includes("/")) {
							const [day, month, year] = part.split("/").map(Number);
							updatedTime = new Date(year < 100 ? 2000 + year : year, month - 1, day);
							break;
						}
					}
					continue;
				}

				const parsed = parseScheduleEntry(detil);
				const { mata_kuliah, dosen, ruang, jenis, online } = parsed;

				if (mata_kuliah.kode === "-") continue;

				if (schedule[day].length === 1 && schedule[day][0].mata_kuliah.kode === "-") {
					schedule[day] = [];
				}

				const existingCodes = new Set(schedule[day].map((entry) => entry.mata_kuliah.kode));
				if (!existingCodes.has(mata_kuliah.kode)) {
					schedule[day].push({
						waktu: timeInfo,
						mata_kuliah,
						dosen,
						ruang,
						jenis,
						online
					});
				}
			}
		}

		const selectedProdi = VALID_PRODI.find((p) => p.kode.toLowerCase() === prodi);

		return new Response(
			JSON.stringify(
				{
					statusCode: 200,
					message: "SUCCESS",
					kalas: {
						prodi: selectedProdi?.name,
						kelas: kelas.toUpperCase()
					},
					data: {
						matkul: schedule,
						lastUpdate: updatedTime,
						semester,
						isRamadhan
					}
				} as ScheduleResponse,
				null,
				2
			),
			{ headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("Error fetching schedule:", error);
		return new Response(
			JSON.stringify(
				{
					statusCode: 500,
					message: "Internal Server Error",
					error: (error as Error).message
				},
				null,
				2
			),
			{ headers: { "Content-Type": "application/json" } }
		);
	}
};
