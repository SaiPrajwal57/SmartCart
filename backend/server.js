const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');


dotenv.config();


connectDB();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/bills',    require('./routes/billRoutes'));
app.use('/api/analytics',require('./routes/analyticsRoutes'));
app.use('/api/profile',  require('./routes/profileRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));
app.use('/api/shops',    require('./routes/shopRoutes'));
app.use('/api/staff',    require('./routes/staffRoutes'));


app.get('/', (req, res) => {
  res.send('API is running...');
});


app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
