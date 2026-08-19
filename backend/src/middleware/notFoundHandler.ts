import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/AppError.js";

/** Catches any request that matched no route — forwarded to the centralized error handler. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`No route matches ${req.method} ${req.originalUrl}`));
}
