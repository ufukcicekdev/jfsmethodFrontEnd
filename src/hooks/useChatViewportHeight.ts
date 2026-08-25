import { useEffect, useState, type RefObject } from "react";

/**
 * Sohbet kutusunun yüksekliğini, ekranda gerçekten görünen alana (klavye
 * açıldığında küçülen VisualViewport) göre hesaplar. Böylece mesaj yazma
 * alanı her zaman klavyenin hemen üstünde kalır.
 *
 * Dönen değer piksel cinsinden yükseklik veya (henüz ölçülmediyse) undefined.
 * undefined iken CSS'teki yedek yükseklik (ör. dvh) kullanılır.
 */
export function useChatViewportHeight(
  ref: RefObject<HTMLElement | null>,
  bottomGap = 8
): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const viewportHeight = vv ? vv.height : window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;
      // Kartın görünür alan içindeki üst konumu
      const top = el.getBoundingClientRect().top - offsetTop;
      const available = viewportHeight - top - bottomGap;
      setHeight(Math.max(320, Math.round(available)));
    };

    update();
    // Görsel viewport klavye ile değişince (iOS/Android)
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [ref, bottomGap]);

  return height;
}
