import './App.css'
import { useFileUploader } from './hooks/useFileUploader'
import { FileList } from './components/FileList'

function App() {
  const {
    txtFiles, statuses, fileInfo, errors, deletedIndices,
    scanning, hasScanned,
    doneCount, errorCount, activeCount, visibleCount, allComplete, showProgress,
    handleChooseFolder,
    handleChooseFiles,
    handleCancelFile,
    handleResumeFile,
    handleDeleteFile,
  } = useFileUploader()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Folder Uploader</h1>
        <p className="subtitle">
          Pick a folder or individual <code>.txt</code> files — they are uploaded and classified automatically.
        </p>
      </header>

      <section className="picker-section">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleChooseFolder}
          disabled={scanning}
        >
          {scanning ? 'Scanning…' : 'Choose Folder'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleChooseFiles}
          disabled={scanning}
        >
          Choose Files
        </button>
      </section>

      {hasScanned && !scanning && visibleCount === 0 && (
        <p className="empty-notice">No .txt files found in the selected folder.</p>
      )}

      {visibleCount > 0 && (
        <FileList
          txtFiles={txtFiles}
          statuses={statuses}
          fileInfo={fileInfo}
          errors={errors}
          deletedIndices={deletedIndices}
          activeCount={activeCount}
          doneCount={doneCount}
          errorCount={errorCount}
          visibleCount={visibleCount}
          allComplete={allComplete}
          showProgress={showProgress}
          onCancel={handleCancelFile}
          onResume={handleResumeFile}
          onDelete={handleDeleteFile}
        />
      )}
    </div>
  )
}

export default App
