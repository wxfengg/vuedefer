# vuedefer

A Vue 3 lazy render component based on the IntersectionObserver API. Components are mounted only when they enter the viewport, and updates are frozen when they leave, optimizing page performance.

## Features

- 🚀 **Lazy Mount** - Components are mounted only when they enter the viewport
- ❄️ **Update Freezing** - Automatically freezes component updates when leaving the viewport
- 📦 **Lightweight** - Zero dependencies, small bundle size

## Installation

```bash
npm install vuedefer
# or
pnpm add vuedefer
# or
yarn add vuedefer
```

## Basic Usage

```vue
<script setup lang="ts">
import { LazyRender } from 'vuedefer'
</script>

<template>
  <LazyRender>
    <HeavyComponent />
    <template #fallback>
      <div class="placeholder">Loading...</div>
    </template>
  </LazyRender>
</template>
```

## Examples

### Basic Lazy Loading

Components are mounted and rendered only when they enter the viewport:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LazyRender } from 'vuedefer'
import HeavyComponent from './HeavyComponent.vue'

const isMounted = ref(false)
</script>

<template>
  <div class="container">
    <!-- Status indicator -->
    <div class="status" :class="{ mounted: isMounted }">
      {{ isMounted ? '✅ Mounted' : '⏳ Not mounted' }}
    </div>

    <!-- Spacer to simulate scrolling -->
    <div style="height: 100vh;">
      <p>👇 Scroll down to see lazy loading in action...</p>
    </div>

    <!-- Lazy loaded component -->
    <LazyRender>
      <HeavyComponent @vue:mounted="isMounted = true" />
      <template #fallback>
        <div class="placeholder">Loading...</div>
      </template>
    </LazyRender>
  </div>
</template>
```

### Custom Root Element and Margin

Specify a custom scroll container and trigger margin:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LazyRender } from 'vuedefer'

const scrollContainer = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="scrollContainer" class="scroll-container">
    <LazyRender :root="scrollContainer" root-margin="100px">
      <ExpensiveChart />
      <template #fallback>
        <div class="skeleton">Loading chart...</div>
      </template>
    </LazyRender>
  </div>
</template>
```

### Configure Visibility Threshold

Use `threshold` to control how much of the component must be visible to trigger rendering:

```vue
<template>
  <!-- Trigger rendering when 50% of the component is visible -->
  <LazyRender :threshold="0.5">
    <VideoPlayer />
    <template #fallback>
      <div class="video-placeholder">Preparing video...</div>
    </template>
  </LazyRender>
</template>
```

### Multiple Thresholds

```vue
<template>
  <!-- Support multiple thresholds -->
  <LazyRender :threshold="[0, 0.25, 0.5, 0.75, 1]">
    <ProgressiveImage />
  </LazyRender>
</template>
```

### Custom Wrapper Tag

```vue
<template>
  <!-- Use section as the wrapper element -->
  <LazyRender tag="section">
    <ArticleContent />
    <template #fallback>
      <div class="article-skeleton" />
    </template>
  </LazyRender>
</template>
```

## API

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | `'div'` | HTML tag name for the wrapper element |
| `root` | `Element \| Document \| ShadowRoot \| null` | `null` | The root element for IntersectionObserver. `null` uses the browser viewport |
| `rootMargin` | `string` | `undefined` | Margin around the root element to expand or shrink the detection area. Same format as CSS margin, e.g., `'10px'`, `'10px 20px'` |
| `threshold` | `number \| number[]` | `undefined` | Visibility ratio threshold(s) to trigger the callback. `0` triggers when a single pixel is visible, `1` triggers when fully visible |

### Slots

| Name | Description |
|------|-------------|
| `default` | Default slot for the component content to be lazily loaded |
| `fallback` | Placeholder content displayed before the component enters the viewport |

## How It Works

1. **Initial State**: When the component is not in the viewport, the `fallback` slot content is rendered as a placeholder
2. **Entering Viewport**: When the component enters the viewport (detected by IntersectionObserver), the actual component in the `default` slot is mounted and rendered
3. **Leaving Viewport**: When the component leaves the viewport, its `render` function is replaced to return the current `subTree`, freezing updates and avoiding unnecessary re-renders
4. **Re-entering**: When the component re-enters the viewport, the original `render` function is restored, allowing the component to respond to data changes and re-render

## License

MIT
