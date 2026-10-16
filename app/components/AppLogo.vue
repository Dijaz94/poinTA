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
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-10',
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}
</script>

<template>
  <div class="inline-flex items-center gap-2.5 group select-none">
    <!-- Emblema Técnico de Archivo (Pin + Monograma P en proporción Braun/Editorial) -->
    <div
      class="relative shrink-0 flex items-center justify-center rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] p-1 shadow-[var(--atelier-shadow-rest)] transition-transform duration-150 group-hover:-translate-y-0.5"
      :class="sizeClasses[size]"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full"
        aria-hidden="true"
      >
        <path
          d="M18 3C10.82 3 5 8.82 5 16C5 23.4 13.8 30.6 16.5 32.7C17.4 33.4 18.6 33.4 19.5 32.7C22.2 30.6 31 23.4 31 16C31 8.82 25.18 3 18 3Z"
          class="fill-[var(--atelier-cobalt)]"
        />
        <path
          d="M13 9H18.5C21.5376 9 24 11.4624 24 14.5C24 17.5376 21.5376 20 18.5 20H16.5V25H13V9ZM16.5 12.5V16.5H18.5C19.6046 16.5 20.5 15.6046 20.5 14.5C20.5 13.3954 19.6046 12.5 18.5 12.5H16.5Z"
          class="fill-[var(--atelier-surface)]"
        />
      </svg>
    </div>

    <!-- Tipografía Editorial + Etiqueta Monoespaciada -->
    <div v-if="showText" class="flex flex-col leading-none">
      <div class="flex items-baseline gap-1.5">
        <span
          class="font-editorial font-semibold text-highlighted tracking-tight"
          :class="textSizeClasses[size]"
        >
          Poin<span class="italic text-[var(--atelier-cobalt)]">TA</span>
        </span>
      </div>
      <span
        v-if="subtitle"
        class="font-tech text-[10px] uppercase tracking-wider text-muted hidden sm:inline mt-0.5"
      >
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>
