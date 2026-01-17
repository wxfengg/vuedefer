<script setup lang="ts">
import { ref } from 'vue'
import { LazyRender } from '../../src'
import HeavyComponent from './HeavyComponent.vue'

const isMounted = ref(false)
</script>

<template>
  <div class="app">
    <h1>LazyRender Demo</h1>
    <p>Scroll down to see lazy rendering in action.</p>
    <!-- Status indicator -->
    <div class="status" :class="{ mounted: isMounted }">
      {{ isMounted ? '✅ Mounted' : '⏳ Not mounted' }}
    </div>

    <!-- Spacer to force scrolling -->
    <div class="spacer">
      <p>👇 Keep scrolling...</p>
    </div>

    <!-- LazyRender will only render HeavyComponent when it enters viewport -->
    <LazyRender>
      <HeavyComponent @vue:mounted="isMounted = true" />
      <template #fallback>
        <div class="placeholder">
          Loading...
        </div>
      </template>
    </LazyRender>

    <div class="spacer" />
  </div>
</template>

<style>
.app {
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.spacer {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  margin: 20px 0;
}

.placeholder {
  padding: 40px;
  background: #eee;
  text-align: center;
  color: #999;
}

.status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: #fee2e2;
  color: #991b1b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status.mounted {
  background: #dcfce7;
  color: #166534;
}
</style>
