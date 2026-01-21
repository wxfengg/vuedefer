import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useIntersectionObserver } from '../composables/useIntersectionObserver'

describe('useIntersectionObserver', () => {
  let mockObserve: ReturnType<typeof vi.fn>
  let mockUnobserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>
  let intersectionCallback: IntersectionObserverCallback
  let originalIntersectionObserver: typeof IntersectionObserver

  beforeEach(() => {
    mockObserve = vi.fn()
    mockUnobserve = vi.fn()
    mockDisconnect = vi.fn()

    // Save original IntersectionObserver
    originalIntersectionObserver = window.IntersectionObserver

    // Mock IntersectionObserver as a class
    window.IntersectionObserver = vi.fn(function (this: any, callback: IntersectionObserverCallback) {
      intersectionCallback = callback
      this.observe = mockObserve
      this.unobserve = mockUnobserve
      this.disconnect = mockDisconnect
    }) as any
  })

  afterEach(() => {
    // Restore original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver
  })

  it('should initialize with isVisible as false', () => {
    const target = ref<HTMLElement | null>(null)
    const { isVisible } = useIntersectionObserver(target)

    expect(isVisible.value).toBe(false)
  })

  it('should observe target element when provided', async () => {
    const target = ref<HTMLElement | null>(null)
    useIntersectionObserver(target)

    const element = document.createElement('div')
    target.value = element

    await nextTick()

    expect(mockObserve).toHaveBeenCalledWith(element)
  })

  it('should update isVisible when element enters viewport', async () => {
    const target = ref<HTMLElement | null>(document.createElement('div'))
    const { isVisible } = useIntersectionObserver(target)

    await nextTick()

    // Simulate element entering viewport
    intersectionCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )

    expect(isVisible.value).toBe(true)
  })

  it('should update isVisible when element leaves viewport', async () => {
    const target = ref<HTMLElement | null>(document.createElement('div'))
    const { isVisible } = useIntersectionObserver(target)

    await nextTick()

    // Enter viewport
    intersectionCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(isVisible.value).toBe(true)

    // Leave viewport
    intersectionCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(isVisible.value).toBe(false)
  })

  it('should pass options to IntersectionObserver', () => {
    const target = ref<HTMLElement | null>(null)
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '10px',
      threshold: 0.5,
    }

    useIntersectionObserver(target, options)

    expect(window.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), options)
  })

  it('should unobserve element when target changes', async () => {
    const target = ref<HTMLElement | null>(document.createElement('div'))
    useIntersectionObserver(target)

    await nextTick()

    const newElement = document.createElement('div')
    target.value = newElement

    await nextTick()

    expect(mockUnobserve).toHaveBeenCalled()
    expect(mockObserve).toHaveBeenCalledWith(newElement)
  })

  it('should disconnect observer when stop is called', async () => {
    const target = ref<HTMLElement | null>(document.createElement('div'))
    const { stop } = useIntersectionObserver(target)

    await nextTick()

    stop()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should not observe when target is null', async () => {
    const target = ref<HTMLElement | null>(null)
    useIntersectionObserver(target)

    await nextTick()

    expect(mockObserve).not.toHaveBeenCalled()
  })
})
