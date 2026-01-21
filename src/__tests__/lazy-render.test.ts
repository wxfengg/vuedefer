import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { defineComponent, h, nextTick, ref } from 'vue'
import { LazyRender } from '../lazy-render'

describe('lazyRender', () => {
  let intersectionCallback: IntersectionObserverCallback
  let mockObserve: ReturnType<typeof vi.fn>
  let mockUnobserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>
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

  // Helper to simulate viewport intersection
  function simulateIntersection(isIntersecting: boolean) {
    intersectionCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  }

  describe('rendering', () => {
    it('should render fallback slot when not in viewport', async () => {
      const screen = render(LazyRender, {
        slots: {
          default: () => h('div', { class: 'content' }, 'Content'),
          fallback: () => h('div', { class: 'fallback' }, 'Loading...'),
        },
      })

      await expect.element(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render default slot when entering viewport', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const screen = render(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', { class: 'fallback' }, 'Loading...'),
        },
      })

      // Initially shows fallback
      await expect.element(screen.getByText('Loading...')).toBeInTheDocument()

      // Simulate entering viewport
      simulateIntersection(true)
      await nextTick()

      await expect.element(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should use custom tag for wrapper element', async () => {
      const screen = render(LazyRender, {
        props: { tag: 'section' },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      await expect.element(screen.container.querySelector('section')).toBeInTheDocument()
    })

    it('should use div as default wrapper tag', async () => {
      const screen = render(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      await expect.element(screen.container.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('props', () => {
    it('should pass root option to IntersectionObserver', async () => {
      const root = document.createElement('div')

      render(LazyRender, {
        props: { root },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root }),
      )
    })

    it('should pass rootMargin option to IntersectionObserver', async () => {
      render(LazyRender, {
        props: { rootMargin: '100px' },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ rootMargin: '100px' }),
      )
    })

    it('should pass threshold option to IntersectionObserver', async () => {
      render(LazyRender, {
        props: { threshold: 0.5 },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 }),
      )
    })

    it('should support array threshold', async () => {
      render(LazyRender, {
        props: { threshold: [0, 0.5, 1] },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: [0, 0.5, 1] }),
      )
    })
  })

  describe('events', () => {
    it('should emit change event when visibility changes', async () => {
      const onChangeMock = vi.fn()

      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      render(LazyRender, {
        props: {
          onChange: onChangeMock,
        },
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport
      simulateIntersection(true)
      await nextTick()

      // The change event should be emitted
      expect(onChangeMock).toHaveBeenCalledWith(true)
    })

    it('should emit change with false when leaving viewport', async () => {
      const onChangeMock = vi.fn()

      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      render(LazyRender, {
        props: {
          onChange: onChangeMock,
        },
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport first
      simulateIntersection(true)
      await nextTick()

      // Leave viewport
      simulateIntersection(false)
      await nextTick()

      expect(onChangeMock).toHaveBeenCalledWith(false)
    })
  })

  describe('update freezing', () => {
    it('should keep content when leaving viewport', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Hello World')
        },
      })

      const screen = render(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport
      simulateIntersection(true)
      await nextTick()

      await expect.element(screen.getByText('Hello World')).toBeInTheDocument()

      // Leave viewport - content should still be visible (frozen state)
      simulateIntersection(false)
      await nextTick()

      // Content should still exist even when frozen
      await expect.element(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should resume updates when re-entering viewport', async () => {
      const count = ref(0)

      const ChildComponent = defineComponent({
        props: ['count'],
        setup(props) {
          return () => h('div', { class: 'content' }, `Count: ${props.count}`)
        },
      })

      const TestWrapper = defineComponent({
        setup() {
          return () => h(LazyRender, null, {
            default: () => h(ChildComponent, { count: count.value }),
            fallback: () => h('div', 'Loading...'),
          })
        },
      })

      const screen = render(TestWrapper)

      // Enter viewport
      simulateIntersection(true)
      await nextTick()

      await expect.element(screen.getByText('Count: 0')).toBeInTheDocument()

      // Leave viewport
      simulateIntersection(false)
      await nextTick()

      // Update count while out of viewport
      count.value = 5
      await nextTick()

      // Re-enter viewport
      simulateIntersection(true)
      await nextTick()

      // Component should update with new value
      await expect.element(screen.getByText('Count: 5')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty default slot gracefully', async () => {
      const screen = render(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      await expect.element(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle missing fallback slot', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const screen = render(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
        },
      })

      // Should not throw and container should exist
      expect(screen.container).toBeDefined()
    })

    it('should cleanup observer on unmount', async () => {
      const screen = render(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      screen.unmount()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
})
