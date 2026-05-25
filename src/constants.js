export const BE_STATE = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  COMPLETED:  'Completed',
  FAILED:     'Failed',
  INACTIVE:   'Inactive',
}

export const STATUS = {
  QUEUED:      'queued',      // waiting for its turn to be uploaded
  PENDING:     'pending',     // uploaded to BE, waiting for the worker
  UPLOADING:   'uploading',
  CLASSIFYING: 'classifying',
  DONE:        'done',
  ERROR:       'error',
  CANCELED:    'canceled',
}
