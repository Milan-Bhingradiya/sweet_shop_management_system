import app from './app';

const PORT = process.env.PORT || 5000;

console.log('Starting server...');

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
