import { useState, useRef, useEffect, useCallback } from 'react'
import { BE_STATE, STATUS } from '../constants'
import { getFiles, uploadFile, cancelFile, resumeFile, deleteFile } from '../api'
import { mapBeStateToStatus } from '../utils'

const POLL_MS = 1500

export function useFileUploader() {
  const [txtFiles, setTxtFiles]             = useState([])
  const [statuses, setStatuses]             = useState({})
  const [fileInfo, setFileInfo]             = useState({})
  const [errors, setErrors]                 = useState({})
  const [scanning, setScanning]             = useState(false)
  const [hasScanned, setHasScanned]         = useState(false)
  const [deletedIndices, setDeletedIndices] = useState(() => new Set())

  const idToIndex = useRef(new Map())
  const nextIndex = useRef(0)
  const pollTimer = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const tick = useCallback(async () => {
    let rows
    try {
      rows = await getFiles()
    } catch (err) {
      console.error('Poll failed:', err)
      return
    }

    let stillActive = false
    const nextStatuses = {}
    const nextInfo = {}
    const nextErrors = {}

    for (const file of rows) {
      const index = idToIndex.current.get(file.id)
      if (index === undefined) continue

      nextStatuses[index] = mapBeStateToStatus(file.state)
      nextInfo[index] = { id: file.id, progress: file.progress, language: file.language, score: file.score }
      if (file.state === BE_STATE.FAILED) nextErrors[index] = 'Classification failed'
      if (file.state === BE_STATE.PENDING || file.state === BE_STATE.PROCESSING) stillActive = true
    }

    setStatuses(prev => ({ ...prev, ...nextStatuses }))
    setFileInfo(prev => ({ ...prev, ...nextInfo }))
    setErrors(prev => ({ ...prev, ...nextErrors }))

    if (!stillActive) stopPolling()
  }, [stopPolling])

  const ensurePolling = useCallback(() => {
    if (pollTimer.current) return
    pollTimer.current = setInterval(tick, POLL_MS)
    tick()
  }, [tick])

  useEffect(() => {
    let unmounted = false
    ;(async () => {
      try {
        const rows = await getFiles()
        if (unmounted || !rows.length) return

        const initialStatuses = {}
        const initialInfo = {}
        const initialErrors = {}
        const initialFiles = []
        let active = false

        rows.forEach((file, index) => {
          idToIndex.current.set(file.id, index)
          initialFiles.push({ name: file.fileName, size: file.sizeBytes })
          initialStatuses[index] = mapBeStateToStatus(file.state)
          initialInfo[index] = { id: file.id, progress: file.progress, language: file.language, score: file.score }
          if (file.state === BE_STATE.FAILED) initialErrors[index] = 'Classification failed'
          if (file.state === BE_STATE.PENDING || file.state === BE_STATE.PROCESSING) active = true
        })

        setTxtFiles(initialFiles)
        setStatuses(initialStatuses)
        setFileInfo(initialInfo)
        setErrors(initialErrors)
        setHasScanned(true)
        nextIndex.current = rows.length
        if (active) ensurePolling()
      } catch (err) {
        console.error('Failed to load files:', err)
      }
    })()
    return () => { unmounted = true; stopPolling() }
  }, [ensurePolling, stopPolling])

  async function uploadOne(file, index) {
    setStatuses(prev => ({ ...prev, [index]: STATUS.UPLOADING }))
    try {
      const { id } = await uploadFile(file)
      idToIndex.current.set(id, index)
      setFileInfo(prev => ({ ...prev, [index]: { id, progress: 0 } }))
      setStatuses(prev => ({ ...prev, [index]: STATUS.PENDING }))
      ensurePolling()
    } catch (err) {
      setStatuses(prev => ({ ...prev, [index]: STATUS.ERROR }))
      setErrors(prev => ({ ...prev, [index]: err.message }))
    }
  }

  async function runUploads(pairs) {
    for (const { file, index } of pairs) {
      await uploadOne(file, index)
    }
  }

  function addFiles(selected) {
    if (!selected.length) return
    const start = nextIndex.current
    nextIndex.current += selected.length
    const pairs = selected.map((file, i) => ({ file, index: start + i }))
    setTxtFiles(prev => [...prev, ...selected])
    setHasScanned(true)
    runUploads(pairs)
  }

  async function* walk(dir) {
    for await (const handle of dir.values()) {
      if (handle.kind === 'file') {
        if (handle.name.toLowerCase().endsWith('.txt')) yield await handle.getFile()
      } else if (handle.kind === 'directory') {
        yield* walk(handle)
      }
    }
  }

  async function handleChooseFolder() {
    let dir
    try {
      dir = await window.showDirectoryPicker()
    } catch (err) {
      if (err.name !== 'AbortError') console.error('showDirectoryPicker failed:', err)
      return
    }

    setScanning(true)
    const selected = []
    for await (const file of walk(dir)) selected.push(file)
    setScanning(false)
    addFiles(selected)
  }

  async function handleChooseFiles() {
    let handles
    try {
      handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }],
      })
    } catch (err) {
      if (err.name !== 'AbortError') console.error('showOpenFilePicker failed:', err)
      return
    }
    addFiles(await Promise.all(handles.map(h => h.getFile())))
  }

  async function handleCancelFile(index) {
    const id = fileInfo[index]?.id
    if (!id) return
    try {
      await cancelFile(id)
      setStatuses(prev => ({ ...prev, [index]: STATUS.CANCELED }))
      setFileInfo(prev => ({ ...prev, [index]: { ...prev[index], progress: 0 } }))
    } catch (err) {
      console.error('Cancel failed:', err)
    }
  }

  async function handleResumeFile(index) {
    const id = fileInfo[index]?.id
    if (!id) return
    setStatuses(prev => ({ ...prev, [index]: STATUS.PENDING }))
    setFileInfo(prev => ({ ...prev, [index]: { ...prev[index], progress: 0 } }))
    try {
      await resumeFile(id)
      ensurePolling()
    } catch (err) {
      setStatuses(prev => ({ ...prev, [index]: STATUS.ERROR }))
      setErrors(prev => ({ ...prev, [index]: err.message }))
    }
  }

  async function handleDeleteFile(index) {
    const id = fileInfo[index]?.id
    if (!id) return
    try {
      await deleteFile(id)
      idToIndex.current.delete(id)
      setDeletedIndices(prev => new Set(prev).add(index))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const isLive = index => !deletedIndices.has(index)

  let doneCount = 0
  let errorCount = 0
  let activeCount = 0
  for (const [index, status] of Object.entries(statuses)) {
    if (!isLive(+index)) continue
    if (status === STATUS.DONE) doneCount++
    else if (status === STATUS.ERROR) errorCount++
    else if (status === STATUS.UPLOADING || status === STATUS.PENDING || status === STATUS.CLASSIFYING) activeCount++
  }

  const visibleCount = txtFiles.length - deletedIndices.size
  const allComplete  = visibleCount > 0 && activeCount === 0
  const showProgress = activeCount > 0 || doneCount > 0 || errorCount > 0

  return {
    txtFiles, statuses, fileInfo, errors, deletedIndices,
    scanning, hasScanned,
    doneCount, errorCount, activeCount,
    visibleCount, allComplete, showProgress,
    handleChooseFolder, handleChooseFiles,
    handleCancelFile, handleResumeFile, handleDeleteFile,
  }
}
