import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend EMPLIFI corriendo en http://localhost:${PORT}`);
});
