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
};

type ScheduleResponse = {
	statusCode: number;
	message: string;
	data: Record<string, ScheduleEntry[]>;
};

export type PageServerLoad = Kit.ServerLoad<RouteParams>;
export type PageLoad = Kit.Load<RouteParams>;
