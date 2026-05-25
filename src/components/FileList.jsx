import { useState } from 'react'
import { STATUS } from '../constants'
import { FileItem } from './FileItem'

export function FileList({
  txtFiles, statuses, fileInfo, errors, deletedIndices,
  activeCount, doneCount, errorCount, visibleCount, allComplete, showProgress,
  onCancel, onResume, onDelete,
}) {
  const [hideCompleted, setHideCompleted] = useState(false)

  const visible = txtFiles
    .map((file, i) => ({ file, i }))
    .filter(({ i }) => !deletedIndices.has(i) && (!hideCompleted || statuses[i] !== STATUS.DONE))

  return (
    <section className="file-list-section">
      <div className="file-list-header">
        <span className="file-count">
          {visibleCount} .txt file{visibleCount !== 1 ? 's' : ''}
          {' · '}
          {allComplete
            ? errorCount === 0 && doneCount === visibleCount
              ? 'All done'
              : `${doneCount} done${errorCount ? `, ${errorCount} failed` : ''}`
            : activeCount > 0
            ? `Processing… ${Math.min(doneCount + errorCount + 1, visibleCount)} / ${visibleCount}`
            : `${doneCount} done${errorCount ? `, ${errorCount} failed` : ''}`}
        </span>

        {doneCount > 0 && (
          <button
            type="button"
            className="btn-toggle-completed"
            onClick={() => setHideCompleted(h => !h)}
          >
            {hideCompleted ? `Show completed (${doneCount})` : 'Hide completed'}
          </button>
        )}

        {showProgress && (
          <div className="overall-progress">
            <div
              className="overall-progress-fill"
              style={{ width: `${((doneCount + errorCount) / visibleCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      <ul className="file-list">
        {visible.map(({ file, i }) => (
          <FileItem
            key={i}
            file={file}
            status={statuses[i] ?? STATUS.PENDING}
            info={fileInfo[i]}
            error={errors[i]}
            onCancel={() => onCancel(i)}
            onResume={() => onResume(i)}
            onDelete={() => onDelete(i)}
          />
        ))}
      </ul>
    </section>
  )
}
