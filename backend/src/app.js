require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const adminRouter = require('./routes/admin');
const studentRouter = require('./routes/student');
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);

// Test route
app.get('/', (req, res) => {
  res.send('Examination Management System Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
