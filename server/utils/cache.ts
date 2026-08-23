export async function clearNitroCache() {
  try {
    const cache = useStorage('cache')
    await cache.clear()
    console.log('✅ Nitro SWR/ISR cache cleared due to database mutation.')
  } catch (error) {
    console.error('❌ Failed to clear Nitro cache:', error)
  }
}
