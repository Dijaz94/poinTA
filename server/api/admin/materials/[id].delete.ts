import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de material requerido.' })
  }

  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) {
    throw createError({ statusCode: 404, statusMessage: 'Material no encontrado.' })
  }

  await assertTaCanModify(event, material.subjectId)

  // Si el archivo pertenece al bucket de Supabase, eliminarlo del storage
  if (material.fileUrl.includes('/storage/v1/object/public/materials/')) {
    const parts = material.fileUrl.split('/storage/v1/object/public/materials/')
    if (parts[1]) {
      try {
        const supabase = await serverSupabaseClient(event)
        await supabase.storage.from('materials').remove([decodeURIComponent(parts[1])])
      } catch (storageErr) {
        console.error('Error al remover de storage:', storageErr)
      }
    }
  }

  return await prisma.material.delete({ where: { id } })
})