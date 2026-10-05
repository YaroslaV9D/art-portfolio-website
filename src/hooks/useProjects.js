import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  getPublicImageUrl,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase'

const PROJECT_COLUMNS = [
  'id',
  'slug',
  'title',
  'description',
  'year',
  'medium',
  'dimensions',
  'cover_image_path',
  'sort_order',
  'is_published',
  'created_at',
  'updated_at',
].join(',')

const SESSION_CACHE_KEY = 'high-culture:projects:v1'

let memoryRows = null
let requestPromise = null
let fetchedThisAppSession = false

const normalizeProjects = (rows = []) => rows.map((row, index) => ({
  ...row,
  number: String(index + 1).padStart(2, '0'),
  image: getPublicImageUrl(row.cover_image_path),
  brief: row.description || '',
  category: row.medium || 'Painting',
}))

const readSessionCache = () => {
  if (typeof window === 'undefined') return null

  try {
    const value = window.sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!value) return null

    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeSessionCache = (rows) => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(rows))
  } catch {
    // Storage can be unavailable in private/locked-down browser modes.
  }
}

const getRowsSignature = (rows = []) => rows
  .map((row) => [
    row.id,
    row.updated_at,
    row.sort_order,
    row.cover_image_path,
    row.slug,
  ].join(':'))
  .join('|')

const fetchProjects = async ({force = false} = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add the VITE_SUPABASE_* environment variables.')
  }

  if (!force && fetchedThisAppSession && memoryRows) return memoryRows
  if (requestPromise) return requestPromise

  requestPromise = (async () => {
    const {data, error} = await supabase
      .from('projects')
      .select(PROJECT_COLUMNS)
      .eq('is_published', true)
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: true})

    if (error) throw error

    memoryRows = data || []
    fetchedThisAppSession = true
    writeSessionCache(memoryRows)
    return memoryRows
  })()

  try {
    return await requestPromise
  } finally {
    requestPromise = null
  }
}

export default function useProjects() {
  const initialRows = useMemo(() => {
    if (memoryRows) return memoryRows

    const cachedRows = readSessionCache()
    if (cachedRows) memoryRows = cachedRows
    return cachedRows || []
  }, [])

  const [rows, setRows] = useState(initialRows)
  const [loading, setLoading] = useState(initialRows.length === 0)
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({force = true} = {}) => {
    try {
      const freshRows = await fetchProjects({force})

      setRows((currentRows) => (
        getRowsSignature(currentRows) === getRowsSignature(freshRows)
          ? currentRows
          : freshRows
      ))
      setError(null)
      return freshRows
    } catch (nextError) {
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadOnce = async () => {
      try {
        const freshRows = await fetchProjects()
        if (!active) return

        setRows((currentRows) => (
          getRowsSignature(currentRows) === getRowsSignature(freshRows)
            ? currentRows
            : freshRows
        ))
        setError(null)
      } catch (nextError) {
        if (active) setError(nextError)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOnce()

    return () => {
      active = false
    }
  }, [])

  const projects = useMemo(() => normalizeProjects(rows), [rows])

  return {
    projects,
    loading,
    error,
    refresh,
  }
}
