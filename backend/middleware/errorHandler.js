module.exports = (err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ msg: 'Something went wrong', error: err.message });
};
