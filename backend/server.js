const express = require('express');
const app = express();
const port = 3001;
const routes = require('./routes');

app.use('/api', routes);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});