import createError, { type HttpError } from 'http-errors';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.ts';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: HttpError, req: Request, res: Response, next: NextFunction) {
  res.status(err.status || 500).json({ error: err.message });
});

const port = Number(process.env.PORT) || 3080;
app.listen(port, () => console.log(`Listening on port ${port}`));
