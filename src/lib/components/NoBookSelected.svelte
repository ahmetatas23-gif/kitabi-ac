<script lang="ts">
  import { MAIN_SITE_URL } from '$lib/site-config';
</script>

<div class="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-md text-center">
    <div class="mb-6 flex justify-center text-6xl">📖</div>
    <h2 class="mb-3 text-2xl font-bold text-gray-900">Açılacak kitap belirtilmedi</h2>
    <p class="mb-8 text-gray-600">
      Bu sayfa, ana siteden "📖 Kitabı Aç" butonuyla bir PDF adresiyle birlikte açılmalı.
    </p>
    <a
      href={MAIN_SITE_URL}
      class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
    >
      ← Ana Siteye Dön
    </a>
  </div>
</div>
