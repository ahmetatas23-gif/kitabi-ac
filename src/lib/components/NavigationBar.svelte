<script lang="ts">
  // Kitabı Aç — üst gezinme çubuğu
  import { MAIN_SITE_URL } from '$lib/site-config';
</script>

<div class="sticky top-0 z-[200] flex items-center justify-between border-b bg-gray-800 px-4 py-2 text-white">
  <div class="flex items-center gap-4">
    <a
      href={MAIN_SITE_URL}
      class="rounded px-3 py-1 text-sm font-medium transition-colors hover:bg-gray-700"
    >
      ← Ana Siteye Dön
    </a>
    <span class="text-gray-400">|</span>
    <span class="text-sm font-semibold">Kitabı Aç</span>
  </div>
</div>
