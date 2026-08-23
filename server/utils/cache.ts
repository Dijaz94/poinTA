export async function clearNitroCache() {
  try {
    const storage = useStorage()
    const keys = await storage.getKeys()
    console.log('All storage keys before clear:', keys)
    const cache = useStorage('cache')
    const cacheKeys = await cache.getKeys()
    console.log('Cache keys before clear:', cacheKeys)
    await cache.clear()
    console.log('✅ Nitro SWR/ISR cache cleared due to database mutation.')
  } catch (error) {
    console.error('❌ Failed to clear Nitro cache:', error)
  }
}
