<script lang="ts">
  import { MAIN_SITE_URL } from '$lib/site-config';

  interface Props {
    message: string;
    code?: number | string;
    onRetry?: () => void;
  }
  let { message, code, onRetry }: Props = $props();
</script>

<div class="flex h-full items-center justify-center bg-gray-50 p-8">
  <div class="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
    <div class="mb-3 text-4xl">⚠️</div>
    <h2 class="mb-2 text-lg font-semibold text-gray-900">Kitap açılamadı</h2>
    <p class="mb-1 break-words text-sm text-gray-600">{message}</p>
    {#if code !== undefined}
      <p class="mb-4 text-xs text-gray-400">Hata kodu: {code}</p>
    {:else}
      <div class="mb-4"></div>
    {/if}
    <div class="flex justify-center gap-2">
      {#if onRetry}
        <button
          type="button"
          onclick={onRetry}
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Tekrar Dene
        </button>
      {/if}
      <a
        href={MAIN_SITE_URL}
        class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        ← Ana Siteye Dön
      </a>
    </div>
  </div>
</div>
