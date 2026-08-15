// FloatingToolbar'ın "yapışık" (docked = sabit sol şerit) mi yoksa serbestçe
// taşınan bir palet mi olduğunu, ana sayfa layout'unun da bilmesi gerekiyor
// (yapışıkken içerik alanına sola boşluk bırakmak için). Ayrı, küçük bir
// modül state'i — tüm zbookStore'u buna bulaştırmaya gerek yok.
export const toolbarState = $state({
	docked: true,
	side: 'left' as 'left' | 'right'
});
