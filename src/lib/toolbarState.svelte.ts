// FloatingToolbar'ın "yapışık" (docked = sabit kenar şeridi) mi yoksa serbestçe
// taşınan bir palet mi olduğunu, ana sayfa layout'unun da bilmesi gerekiyor
// (yapışıkken içerik alanına o kenara boşluk bırakmak için). Ayrı, küçük bir
// modül state'i — tüm zbookStore'u buna bulaştırmaya gerek yok.
// side artık sadece 'left'/'right' değil, 'top'/'bottom' da olabilir — araç
// çubuğu artık ekranın dört kenarından herhangi birine yapışabiliyor.
export const toolbarState = $state({
	docked: true,
	side: 'left' as 'left' | 'right' | 'top' | 'bottom'
});
