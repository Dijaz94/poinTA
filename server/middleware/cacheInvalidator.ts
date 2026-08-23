export default defineEventHandler((event) => {
  const method = event.node.req.method
  const url = event.node.req.url

  // Solo interceptamos si es una petición a la API y es un método de mutación
  if (url?.startsWith('/api/') && method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    
    // Escuchamos cuando la petición termina para no bloquear la respuesta
    event.node.res.on('finish', async () => {
      // Si la petición fue exitosa (200, 201, 204), limpiamos la caché
      if (event.node.res.statusCode >= 200 && event.node.res.statusCode < 300) {
        await clearNitroCache()
      }
    })
  }
})
