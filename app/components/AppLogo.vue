<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    subtitle?: string
  }>(),
  {
    size: 'md',
    showText: true,
    subtitle: '',
  }
)

const sizeClasses = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
}

const textSizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
}
</script>

<template>
  <div class="flex items-center gap-2.5 group">
    <!-- SVG Icon (Option 1: Pin + P Monogram) -->
    <div
      class="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
      :class="sizeClasses[size]"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full drop-shadow-sm"
      >
        <!-- Pin contour with integrated P monogram -->
        <path
          d="M18 3C10.82 3 5 8.82 5 16C5 23.4 13.8 30.6 16.5 32.7C17.4 33.4 18.6 33.4 19.5 32.7C22.2 30.6 31 23.4 31 16C31 8.82 25.18 3 18 3Z"
          class="fill-primary"
        />
        <!-- Inner P cutout / contrast -->
        <path
          d="M13 9H18.5C21.5376 9 24 11.4624 24 14.5C24 17.5376 21.5376 20 18.5 20H16.5V25H13V9ZM16.5 12.5V16.5H18.5C19.6046 16.5 20.5 15.6046 20.5 14.5C20.5 13.3954 19.6046 12.5 18.5 12.5H16.5Z"
          fill="white"
        />
        <!-- Focal Point Accent Dot -->
        <circle
          cx="18"
          cy="32.5"
          r="2.5"
          class="fill-emerald-400"
        />
      </svg>
    </div>

    <!-- Text Logo -->
    <div v-if="showText" class="flex flex-col leading-none">
      <div class="flex items-center">
        <span class="font-bold text-ink-900 dark:text-white tracking-tight font-display transition-colors duration-300" :class="textSizeClasses[size]">
          Poin<span class="text-primary-600 dark:text-primary-400">TA</span>
        </span>
      </div>
      <span v-if="subtitle" class="text-xs text-ink-500 dark:text-ink-300 hidden sm:inline mt-0.5 transition-colors duration-300">
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>
