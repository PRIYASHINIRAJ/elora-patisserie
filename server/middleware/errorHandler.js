import multer from 'multer';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error('[server error]', err);

  // Multer file validation / size-limit errors are client mistakes, not server faults.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is too large. Please upload a smaller image or video.'
        : `Upload error: ${err.message}`;
    return res.status(400).json({ error: message });
  }
  if (err.message && /Unsupported file type/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || 'Something went wrong on our end. Please try again.',
  });
}
