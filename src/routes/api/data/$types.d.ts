import type * as Kit from "@sveltejs/kit";

type MatkulDetil = {
	kode: string;
	nama: string;
};

type ScheduleEntry = {
	waktu?: {
		start: string;
		end: string;
		durasi: number;
	};
	mata_kuliah: MatkulDetil;
	dosen: string[];
	ruang: string;
	jenis: string;
	online?: boolean;
};

type ScheduleResponse = {
	statusCode: number;
	message: string;
	data: {
		matkul: Record<string, ScheduleEntry[]>;
		lastUpdate: Date | null;
		semester: "Ganjil" | "Genap";
	};
};

export type PageServerLoad = Kit.ServerLoad<RouteParams>;
export type PageLoad = Kit.Load<RouteParams>;
