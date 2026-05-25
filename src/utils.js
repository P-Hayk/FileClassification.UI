import { BE_STATE, STATUS } from './constants'

export function mapBeStateToStatus(beState) {
  return {
    [BE_STATE.PENDING]:    STATUS.PENDING,
    [BE_STATE.PROCESSING]: STATUS.CLASSIFYING,
    [BE_STATE.COMPLETED]:  STATUS.DONE,
    [BE_STATE.FAILED]:     STATUS.ERROR,
    [BE_STATE.INACTIVE]:   STATUS.CANCELED,
  }[beState] ?? STATUS.PENDING
}

export function statusIcon(status) {
  return { pending: '○', uploading: '◌', classifying: '◌', done: '●', error: '✕', canceled: '⊘' }[status] ?? '○'
}

export function statusLabel(status) {
  return { pending: 'Pending', uploading: 'Uploading…', classifying: 'Classifying…', done: 'Done', error: 'Failed', canceled: 'Canceled' }[status] ?? ''
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
