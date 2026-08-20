import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File | null
  const title = (form.get('title') as string)?.trim()
  const description = (form.get('description') as string)?.trim() || null
  const subjectId = (form.get('subjectId') as string)?.trim()
  const explicitUrl = (form.get('fileUrl') as string)?.trim()

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'El título es requerido.' })
  }

  await assertTaCanModify(event, subjectId)

  let finalUrl = explicitUrl || ''

  // Si enviaron un archivo real binario
  if (file && typeof file === 'object' && file.size > 0) {
    const supabase = await serverSupabaseClient(event)

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${subjectId}/${Date.now()}_${cleanName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error al subir a Supabase Storage desde backend:', uploadError)
      throw createError({
        statusCode: 500,
        statusMessage: `Error en Storage: ${uploadError.message}`,
      })
    }

    const { data: publicUrlData } = supabase.storage
      .from('materials')
      .getPublicUrl(uploadData.path)

    finalUrl = publicUrlData.publicUrl
  }

  if (!finalUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Debes proporcionar un archivo o un enlace.' })
  }

  return await prisma.material.create({
    data: {
      title,
      description,
      fileUrl: finalUrl,
      subjectId,
    },
  })
})