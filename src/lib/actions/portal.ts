/**
 * `use:portal` — düğümü `document.body`'nin sonuna taşır.
 *
 * Neden gerekli: PDF görüntüleyicideki zoom/kaydırma sarmalayıcıları CSS
 * `transform` kullanıyor olabilir. Bir üst öğede `transform` varsa, o
 * öğenin İÇİNDEKİ `position: fixed` elemanlar artık gerçek tarayıcı
 * penceresine göre değil, o `transform`'lu öğeye göre sabitlenir — bu da
 * pop-up'ların "yanlış yerde" (örn. sayfanın yukarısında, kaydırmak
 * gerektiren bir konumda) açılmasına sebep olur. Düğümü `<body>`'ye taşımak
 * bu sorunu kökten çözer.
 */
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
