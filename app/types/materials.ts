export interface Unit {
  id: string
  name: string
  order: number
  createdAt: string
  subjectId: string
  parentId: string | null
  parent?: Unit | null
  children?: Unit[]
  materials?: Material[]
}

export interface Material {
  id: string
  title: string
  description: string | null
  fileUrl: string
  createdAt: string
  subjectId: string
  unitId?: string | null
  unit?: Unit | null
}

