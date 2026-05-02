'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export default function TestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('issues').select('*')
      console.log(data, error)
      setData(data)
      setError(error)
    }
    test()
  }, [])

  return (
    <div className="p-8">
      <h1>Supabase Connection Test</h1>
      {error && <pre className="text-red-500">Error: {JSON.stringify(error, null, 2)}</pre>}
      {data && <pre className="text-green-500">Data: {JSON.stringify(data, null, 2)}</pre>}
      {!data && !error && <p>Loading...</p>}
    </div>
  )
}
