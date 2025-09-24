export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: 'CORS Error' });
  res.status(500).json({ error: 'Something went wrong' });
};
