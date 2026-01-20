import { describe, expect, it } from 'vitest'
import * as vuedefer from '../index'
import { LazyRender } from '../lazy-render'

describe('module exports', () => {
  it('should export LazyRender component', () => {
    expect(vuedefer.LazyRender).toBeDefined()
    expect(vuedefer.LazyRender).toBe(LazyRender)
  })

  it('should have correct component name', () => {
    expect(LazyRender.name).toBe('LazyRender')
  })
})
