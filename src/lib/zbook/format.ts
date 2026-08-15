import type { Size } from '@embedpdf/models';
import type { InteractionKind, ZBookInteraction } from './types';

/**
 * Dışa/içe aktarılan (elle düzenlenebilir) JSON formatı — orijinal proje
 * talimatındaki örnekle birebir aynı:
 *
 * { "page": 47, "type": "lens", "x": 0.22, "y": 0.34, "width": 0.55, "height": 0.31 }
 *
 * x/y/width/height, sayfa genişliği/yüksekliğine göre 0-1 arasında ORANSAL
 * koordinatlardır — sayfanın gerçek nokta boyutunu bilmene gerek kalmadan
 * elle okunabilir/yazılabilir. İçeride (render sırasında) hâlâ EmbedPDF'in
 * PDF-nokta `Rect` sistemini kullanıyoruz (AŞAMA 6 kararı) — bu dosya
 * ikisi arasında dönüşüm yapar.
 */
export interface ExternalInteractionJson {
	id?: string;
	page: number;
	type: string; // 'lens' | 'answer' | 'video' | 'audio' | 'text' | 'button' | 'grid' | 'reveal'
	x: number;
	y: number;
	width: number;
	height: number;
	haftaNo?: number;
	label?: string;
	text?: string;
	href?: string;
	src?: string;
	question?: string;
	answer?: string;
	cells?: string[];
}

const KIND_TO_EXTERNAL_TYPE: Record<InteractionKind, string> = {
	mercek: 'lens',
	'cevap-alani': 'answer',
	video: 'video',
	audio: 'audio',
	metin: 'text',
	buton: 'button',
	'harf-izgara': 'grid',
	'cevap-goster': 'reveal'
};

const EXTERNAL_TYPE_TO_KIND: Record<string, InteractionKind> = Object.fromEntries(
	Object.entries(KIND_TO_EXTERNAL_TYPE).map(([kind, type]) => [type, kind as InteractionKind])
);

export function toExternalFormat(
	interaction: ZBookInteraction,
	pageSize: Size
): ExternalInteractionJson {
	const { rect, config } = interaction;
	const out: ExternalInteractionJson = {
		id: interaction.id,
		page: interaction.pageNumber,
		type: KIND_TO_EXTERNAL_TYPE[interaction.kind] ?? interaction.kind,
		x: round(rect.origin.x / pageSize.width),
		y: round(rect.origin.y / pageSize.height),
		width: round(rect.size.width / pageSize.width),
		height: round(rect.size.height / pageSize.height)
	};
	if (interaction.haftaNo) out.haftaNo = interaction.haftaNo;
	if (config?.label) out.label = config.label as string;
	if (config?.text) out.text = config.text as string;
	if (config?.href) out.href = config.href as string;
	if (config?.src) out.src = config.src as string;
	if (config?.question) out.question = config.question as string;
	if (config?.answer) out.answer = config.answer as string;
	if (config?.cells) out.cells = config.cells as string[];
	return out;
}

export function fromExternalFormat(json: ExternalInteractionJson, pageSize: Size): ZBookInteraction {
	const kind = EXTERNAL_TYPE_TO_KIND[json.type] ?? (json.type as InteractionKind);
	const config: Record<string, unknown> = {};
	if (json.label) config.label = json.label;
	if (json.text) config.text = json.text;
	if (json.href) config.href = json.href;
	if (json.src) config.src = json.src;
	if (json.question) config.question = json.question;
	if (json.answer) config.answer = json.answer;
	if (json.cells) config.cells = json.cells;

	return {
		id: json.id ?? crypto.randomUUID(),
		bookId: '', // çağıran yerde (loader) doldurulacak
		pageNumber: json.page,
		kind,
		haftaNo: json.haftaNo,
		rect: {
			origin: { x: json.x * pageSize.width, y: json.y * pageSize.height },
			size: { width: json.width * pageSize.width, height: json.height * pageSize.height }
		},
		config: Object.keys(config).length ? config : undefined
	};
}

function round(n: number): number {
	return Math.round(n * 10000) / 10000;
}
