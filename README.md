# FileClassification.UI

React frontend for the FileClassification service. Pick a folder or individual `.txt`
files, watch them upload and get classified in real time, and act on each row
individually (cancel, resume, retry, delete).

## Run

```bash
npm install
npm run dev
```

Dev server starts on port 5173 by default (Vite will find the next free port if 5173
is taken) and proxies `/api/*` to the .NET API on `:5262`. Change `vite.config.js`
if your backend lives somewhere else.

```bash
npm run build      # production bundle in dist/
npm run preview    # serve the bundle locally
```

## What it does

The picker uses the File System Access API (`showDirectoryPicker` /
`showOpenFilePicker`) — Chrome, Edge, and Safari 15.2+. Firefox doesn't support these
APIs yet, so the buttons there are no-ops. Folder selection recurses into
subdirectories; only files ending in `.txt` are uploaded.

Uploads are sequential. The browser caps connections per origin to ~6, and we'd
rather leave those slots free for the status poll and any Cancel/Delete the user
clicks while uploads are still happening.

Status comes from a single polling loop. While there's at least one file in `Pending`
or `Processing` state, the hook calls `GET /api/files` every 1.5 seconds and writes
the diff into local state. When everything has settled into a terminal state the
loop stops on its own. Adding more files or hitting Resume kicks it back on.

## File rows and stable indices

The list keeps each file at the index it was given when it was picked. When a row is
deleted it's added to a `deletedIndices` set and filtered out at render time — the
remaining rows keep their original index. This means anything keyed by index
(`statuses`, `fileInfo`, `errors`) never has to be reshuffled and there's no risk of
status updates landing in the wrong row when deletes happen mid-flight.

On reload, the app calls `GET /api/files` once, rebuilds its local state from the
response, and resumes polling if anything is still active.

## Layout

```
src/
  api.js                     fetch helpers — one per endpoint
  constants.js               BE_STATE / STATUS enums
  utils.js                   formatSize, mapBeStateToStatus, statusIcon/Label
  hooks/useFileUploader.js   all state, uploads, and the polling loop
  components/FileList.jsx    list header + iteration over rows
  components/FileItem.jsx    a single row
  App.jsx                    plumbing
```

## State map

Frontend-only statuses (no API equivalent):

| UI status    | When                                              |
|--------------|---------------------------------------------------|
| `queued`     | File picked, waiting its turn to upload.          |
| `uploading`  | Upload POST in-flight.                            |

API → UI mappings:

| API value    | UI status     | When                                   | Actions available         |
|--------------|---------------|----------------------------------------|---------------------------|
| `Pending`    | `pending`     | Uploaded, queued for the worker.       | —                         |
| `Processing` | `classifying` | Worker is reading and classifying.     | Cancel                    |
| `Completed`  | `done`        | Classification finished successfully.  | Delete                    |
| `Failed`     | `error`       | Classification threw.                  | Retry, Delete             |
| `Inactive`   | `canceled`    | User cancelled it.                     | Resume, Delete            |

Retry and Resume both call `PATCH /api/files/:id/resume` — the backend accepts both
`Failed` and `Inactive` and re-queues the file.
