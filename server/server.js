import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import applyMiddleware from './middleware/index.js';
import registerRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

applyMiddleware(app);
registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
