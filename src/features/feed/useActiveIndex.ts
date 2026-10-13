import { useEffect, useState, type RefObject } from 'react'

/**
 * Index of the slide most visible in the scroller (≥ 60 %), or null before the first report.
 * Slides must carry a `data-index` attribute.
 */
export function useActiveIndex(scrollerRef: RefObject<HTMLElement | null>, slideCount: number) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || slideCount === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveIndex(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      { root: scroller, threshold: 0.6 },
    )
    scroller.querySelectorAll('[data-index]').forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [scrollerRef, slideCount])

  return activeIndex
}
