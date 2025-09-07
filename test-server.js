const express = require('express');
const path = require('path');
const app = express();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
