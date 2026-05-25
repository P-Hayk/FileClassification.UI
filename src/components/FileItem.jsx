import { STATUS } from '../constants'
import { statusIcon, statusLabel, formatSize } from '../utils'

export function FileItem({ file, status, info, error, onCancel, onResume, onDelete }) {
  return (
    <li className={`file-item file-item--${status}`}>
      <span className="file-icon">{statusIcon(status)}</span>
      <span className="file-name">{file.name}</span>
      <span className="file-size">{formatSize(file.size)}</span>
      <span className={`file-status file-status--${status}`}>
        {status === STATUS.DONE && info?.language
          ? `${info.language} · ${info.score?.toFixed(1)}%`
          : status === STATUS.CLASSIFYING
          ? `Classifying… ${info?.progress ?? 0}%`
          : statusLabel(status)}
      </span>
      <span className="file-actions">
        {status === STATUS.CLASSIFYING && (
          <button type="button" className="btn-file btn-file-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        {status === STATUS.CANCELED && (
          <button type="button" className="btn-file btn-file-resume" onClick={onResume}>
            Resume
          </button>
        )}
        {status === STATUS.ERROR && (
          <button type="button" className="btn-file btn-file-resume" onClick={onResume}>
            Retry
          </button>
        )}
        {(status === STATUS.CANCELED || status === STATUS.DONE) && (
          <button type="button" className="btn-file btn-file-delete" onClick={onDelete}>
            Delete
          </button>
        )}
      </span>
      {status === STATUS.UPLOADING && (
        <span className="file-progress-bar" />
      )}
      {status === STATUS.CLASSIFYING && (
        <span className="file-progress-real">
          <span className="file-progress-real-fill" style={{ width: `${info?.progress ?? 0}%` }} />
        </span>
      )}
      {status === STATUS.ERROR && error && (
        <span className="file-error">{error}</span>
      )}
    </li>
  )
}
