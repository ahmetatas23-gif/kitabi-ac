import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages "proje sayfası" olarak yayınlanırsa (https://kullanici.github.io/REPO-ADI/)
// site bir alt klasörde yaşar; bunun için BASE_PATH ortam değişkenini
// build sırasında repo adına göre ayarlamak gerekir. Kullanıcı/organizasyon
// kök sayfası (https://kullanici.github.io/) kullanılıyorsa boş bırakılabilir.
// Örnek: BASE_PATH=/zbook-app npm run build
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // GitHub Pages'te client-side routing için SPA yedeği
			precompress: false,
			strict: true
		}),
		paths: {
			base
		}
	}
};

export default config;
