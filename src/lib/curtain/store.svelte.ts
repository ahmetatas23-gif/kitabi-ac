// Perdeleme — PDF'nin üzerinde, sadece belirli bir bölümü gösteren
// yarı saydam koyu bir perde. Viewport (ekran) koordinatında çalışır —
// PDF içeriğini hiçbir şekilde değiştirmez, sadece üstüne binen bir katman.
function defaultRect() {
	if (typeof window === 'undefined') return { x: 200, y: 150, w: 400, h: 250 };
	return {
		x: window.innerWidth / 2 - 200,
		y: window.innerHeight / 2 - 125,
		w: 400,
		h: 250
	};
}

export const curtainStore = $state({
	active: false,
	rect: defaultRect()
});

export function toggleCurtain() {
	curtainStore.active = !curtainStore.active;
	if (curtainStore.active) curtainStore.rect = defaultRect();
}

export function closeCurtain() {
	curtainStore.active = false;
}
