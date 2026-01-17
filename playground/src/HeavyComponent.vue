<script setup lang="ts">
import { onMounted, ref } from 'vue'

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
  console.log('HeavyComponent mounted!')
})
</script>

<template>
  <div class="heavy">
    <h2>🎉 I'm rendered!</h2>
    <p>This component only mounts when scrolled into view.</p>
    <p>Check the console - you'll see the log when this appears.</p>
  </div>
</template>

<style scoped>
.heavy {
  padding: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
}
</style>
