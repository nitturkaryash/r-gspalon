import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import type { Tables } from '../supabaseClient'

type TableNames = keyof Tables

export function useSupabaseQuery<T extends TableNames>(
  tableName: T,
  options?: {
    select?: string
    filter?: Record<string, any>
    limit?: number
  }
) {
  return useQuery({
    queryKey: [tableName, options],
    queryFn: async () => {
      let query = supabase.from(tableName).select(options?.select || '*')

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as unknown as Tables[T][]
    },
  })
} 