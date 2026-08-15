// Doğal Kalem — mevcut kalemden TAMAMEN AYRI, ek bir çizim aracı.
// Mevcut kalemin (EmbedPDF'in kendi `annotation:add-ink` aracı) davranışına
// hiçbir şekilde dokunmuyor; sadece kendi state'ini tutuyor.
export const naturalPenStore = $state({
	active: false,
	color: '#111827',
	width: 3
});

export function toggleNaturalPen() {
	naturalPenStore.active = !naturalPenStore.active;
}

export function deactivateNaturalPen() {
	naturalPenStore.active = false;
}
