async function send(path, init) {
  const res = await fetch(path, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

export const getFiles = () => send('/api/files').then(r => r.json())

export const uploadFile = (file) => {
  const body = new FormData()
  body.append('file', file)
  return send('/api/files', { method: 'POST', body }).then(r => r.json())
}

export const getFile    = (id, signal) => send(`/api/files/${id}`, { signal }).then(r => r.json())

export const cancelFile = (id) => send(`/api/files/${id}/cancel`, { method: 'PATCH' })
export const resumeFile = (id) => send(`/api/files/${id}/resume`, { method: 'PATCH' })
export const deleteFile = (id) => send(`/api/files/${id}`, { method: 'DELETE' })
