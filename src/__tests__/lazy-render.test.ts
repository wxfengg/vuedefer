import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { LazyRender } from '../lazy-render'

describe('lazyRender', () => {
  let intersectionCallback: IntersectionObserverCallback
  let mockObserve: ReturnType<typeof vi.fn>
  let mockUnobserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockObserve = vi.fn()
    mockUnobserve = vi.fn()
    mockDisconnect = vi.fn()

    // Mock IntersectionObserver as a class
    const MockIntersectionObserver = vi.fn(function (this: any, callback: IntersectionObserverCallback) {
      intersectionCallback = callback
      this.observe = mockObserve
      this.unobserve = mockUnobserve
      this.disconnect = mockDisconnect
    })

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Helper to simulate viewport intersection
  function simulateIntersection(isIntersecting: boolean) {
    intersectionCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  }

  describe('rendering', () => {
    it('should render fallback slot when not in viewport', () => {
      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h('div', { class: 'content' }, 'Content'),
          fallback: () => h('div', { class: 'fallback' }, 'Loading...'),
        },
      })

      expect(wrapper.find('.fallback').exists()).toBe(true)
      expect(wrapper.find('.content').exists()).toBe(false)
    })

    it('should render default slot when entering viewport', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', { class: 'fallback' }, 'Loading...'),
        },
      })

      // Initially shows fallback
      expect(wrapper.find('.fallback').exists()).toBe(true)

      // Simulate entering viewport
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.content').exists()).toBe(true)
    })

    it('should use custom tag for wrapper element', () => {
      const wrapper = mount(LazyRender, {
        props: { tag: 'section' },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(wrapper.element.tagName.toLowerCase()).toBe('section')
    })

    it('should use div as default wrapper tag', () => {
      const wrapper = mount(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(wrapper.element.tagName.toLowerCase()).toBe('div')
    })
  })

  describe('props', () => {
    it('should pass root option to IntersectionObserver', () => {
      const root = document.createElement('div')

      mount(LazyRender, {
        props: { root },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root }),
      )
    })

    it('should pass rootMargin option to IntersectionObserver', () => {
      mount(LazyRender, {
        props: { rootMargin: '100px' },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ rootMargin: '100px' }),
      )
    })

    it('should pass threshold option to IntersectionObserver', () => {
      mount(LazyRender, {
        props: { threshold: 0.5 },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 }),
      )
    })

    it('should support array threshold', () => {
      mount(LazyRender, {
        props: { threshold: [0, 0.5, 1] },
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: [0, 0.5, 1] }),
      )
    })
  })

  describe('events', () => {
    it('should emit change event when visibility changes', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      // The change event should be emitted
      const changeEvents = wrapper.emitted('change')
      expect(changeEvents).toBeTruthy()
      expect(changeEvents![0]).toEqual([true])
    })

    it('should emit change with false when leaving viewport', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport first
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      // Leave viewport
      simulateIntersection(false)
      await nextTick()
      await flushPromises()

      const changeEvents = wrapper.emitted('change')
      expect(changeEvents).toBeTruthy()
      expect(changeEvents!.length).toBeGreaterThanOrEqual(2)
      expect(changeEvents![1]).toEqual([false])
    })
  })

  describe('update freezing', () => {
    it('should keep content when leaving viewport', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Hello World')
        },
      })

      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
          fallback: () => h('div', 'Loading...'),
        },
      })

      // Enter viewport
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.content').text()).toBe('Hello World')

      // Leave viewport - content should still be visible (frozen state)
      simulateIntersection(false)
      await nextTick()
      await flushPromises()

      // Content should still exist even when frozen
      expect(wrapper.find('.content').exists()).toBe(true)
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

      const wrapper = mount(TestWrapper)

      // Enter viewport
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.content').text()).toBe('Count: 0')

      // Leave viewport
      simulateIntersection(false)
      await nextTick()
      await flushPromises()

      // Update count while out of viewport
      count.value = 5
      await nextTick()
      await flushPromises()

      // Re-enter viewport
      simulateIntersection(true)
      await nextTick()
      await flushPromises()

      // Component should update with new value
      expect(wrapper.find('.content').text()).toBe('Count: 5')
    })
  })

  describe('edge cases', () => {
    it('should handle empty default slot gracefully', () => {
      const wrapper = mount(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('should handle missing fallback slot', async () => {
      const ChildComponent = defineComponent({
        setup() {
          return () => h('div', { class: 'content' }, 'Content')
        },
      })

      const wrapper = mount(LazyRender, {
        slots: {
          default: () => h(ChildComponent),
        },
      })

      // Should not throw and wrapper should exist
      expect(wrapper.exists()).toBe(true)
    })

    it('should cleanup observer on unmount', async () => {
      const wrapper = mount(LazyRender, {
        slots: {
          fallback: () => h('div', 'Loading...'),
        },
      })

      wrapper.unmount()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
})
