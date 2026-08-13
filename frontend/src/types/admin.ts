// frontend/src/types/admin.ts
export interface AdminBKMaterial {
  id?: number
  product_id?: number
  material_index: number
  kode_material: string
  qty_per_sachet: number
  range_min: number
  range_max: number
}

export interface AdminBKRendemen {
  id?: number
  product_id?: number
  sort_order: number
  persen: number
}

export interface AdminBKProduct {
  id?: number
  kode_produk: string
  nama_produk: string
  materials: AdminBKMaterial[]
  rendemen: AdminBKRendemen[]
  created_at?: string
  updated_at?: string
}

export interface AdminBOMaterial {
  id?: number
  product_id?: number
  material_index: number
  kode_material: string
  label: string
  target_kg: number
}

export interface AdminBOThreshold {
  id?: number
  product_id?: number
  criteria_index: number
  target_index: number
  min_ratio: number
  max_ratio: number
}

export interface AdminBOProduct {
  id?: number
  kode_produk: string
  nama_produk: string
  materials: AdminBOMaterial[]
  thresholds: AdminBOThreshold[]
  created_at?: string
  updated_at?: string
}