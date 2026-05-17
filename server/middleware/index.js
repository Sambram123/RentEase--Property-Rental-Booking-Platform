import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const applyMiddleware = (app) => {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
};

export default applyMiddleware;
