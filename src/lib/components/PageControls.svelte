<script lang="ts">
  import { useViewportCapability } from '@embedpdf/plugin-viewport/svelte';
  import { useScroll } from '@embedpdf/plugin-scroll/svelte';

  interface PageControlsProps {
    documentId: string;
  }

  let { documentId }: PageControlsProps = $props();

  const viewport = useViewportCapability();
  const scroll = useScroll(() => documentId);

  let isVisible = $state(true);
  let isHovering = $state(false);
  let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let inputValue = $state('1');

  // Update input when current page changes
  $effect(() => {
    inputValue = scroll.state.currentPage.toString();
  });

  const startHideTimer = () => {
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
    }
    hideTimeoutId = setTimeout(() => {
      if (!isHovering) {
        isVisible = false;
      }
    }, 4000);
  };

  // Watch for scroll activity
  $effect(() => {
    if (!viewport.provides) return;

    const unsubscribe = viewport.provides.onScrollActivity((activity) => {
      if (activity.documentId === documentId) {
        isVisible = true;
        startHideTimer();
      }
    });

    return () => {
      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId);
      }
      unsubscribe?.();
    };
  });

  const handleMouseEnter = () => {
    isHovering = true;
    isVisible = true;
  };

  const handleMouseLeave = () => {
    isHovering = false;
    startHideTimer();
  };

  const handlePageSubmit = (e: Event) => {
    e.preventDefault();
    const page = parseInt(inputValue);

    if (!isNaN(page) && page >= 1 && page <= scroll.state.totalPages) {
      scroll.provides?.scrollToPage?.({
        pageNumber: page,
      });
    }
  };

  const handlePreviousPage = () => {
    if (scroll.state.currentPage > 1) {
      scroll.provides?.scrollToPage?.({
        pageNumber: scroll.state.currentPage - 1,
      });
    }
  };

  const handleNextPage = () => {
    if (scroll.state.currentPage < scroll.state.totalPages) {
      scroll.provides?.scrollToPage?.({
        pageNumber: scroll.state.currentPage + 1,
      });
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/[^0-9]/g, '');
    inputValue = value;
  };

  // --- Dikeyde sürükle-taşı: bar varsayılan olarak alttan 16px'te durur, kullanıcı
  //     bir tutamaçtan tutup yukarı/aşağı sürükleyerek konumunu değiştirebilir.
  //     Konum "bottom" (px) olarak localStorage'da kalıcı — üstteki içerikle
  //     çakışmaması için ekran yüksekliği içinde sınırlanır. ---
  const POS_KEY = 'zbook:pagecontrols-bottom';
  function loadBottom(): number {
    if (typeof localStorage === 'undefined') return 16;
    const raw = localStorage.getItem(POS_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : 16;
  }
  function clampBottom(b: number): number {
    if (typeof window === 'undefined') return b;
    const margin = 4;
    const barHeight = 40;
    return Math.min(Math.max(b, margin), Math.max(margin, window.innerHeight - barHeight - margin));
  }
  let bottomPx = $state(clampBottom(loadBottom()));
  let dragging = $state(false);

  function startVerticalDrag(e: PointerEvent) {
    dragging = true;
    isVisible = true;
    if (hideTimeoutId) clearTimeout(hideTimeoutId);
    const startY = e.clientY;
    const baseBottom = bottomPx;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (!dragging) return;
      // Fare yukarı çıkınca bottom artar (bar yukarı taşınır), aşağı inince azalır.
      bottomPx = clampBottom(baseBottom + (startY - ev.clientY));
    };
    const onUp = () => {
      dragging = false;
      localStorage.setItem(POS_KEY, String(bottomPx));
      startHideTimer();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
</script>

<div
  role="toolbar"
  aria-label="Page navigation"
  tabindex="-1"
  class="pointer-events-auto absolute left-1/2 z-[1000] -translate-x-1/2 transition-opacity duration-200 ease-in-out"
  style="opacity: {isVisible ? 1 : 0}; bottom: {bottomPx}px; touch-action: none;"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <div class="flex items-center gap-1 rounded border border-gray-300 bg-gray-50 p-1 shadow-md">
    <!-- Sürükleme tutamacı: yukarı/aşağı taşımak için -->
    <button
      type="button"
      title="Yukarı/aşağı taşı (sürükle)"
      onpointerdown={startVerticalDrag}
      class="flex h-8 w-4 cursor-ns-resize items-center justify-center text-gray-400 hover:text-gray-600"
    >
      ⠿
    </button>
    <!-- Previous Page Button -->
    <button
      class="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
      onclick={handlePreviousPage}
      disabled={scroll.state.currentPage === 1}
      title="Previous Page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M15 6l-6 6l6 6" />
      </svg>
    </button>

    <!-- Page Input Form -->
    <form onsubmit={handlePageSubmit} class="flex items-center gap-2">
      <input
        type="text"
        name="page"
        value={inputValue}
        oninput={handleInputChange}
        class="h-7 w-10 rounded border border-gray-300 bg-white px-1 text-center text-sm focus:border-gray-400 focus:outline-none"
      />
      <span class="text-sm text-gray-600">{scroll.state.totalPages}</span>
    </form>

    <!-- Next Page Button -->
    <button
      class="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
      onclick={handleNextPage}
      disabled={scroll.state.currentPage === scroll.state.totalPages}
      title="Next Page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </button>
  </div>
</div>
