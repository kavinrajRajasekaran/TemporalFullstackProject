import { Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../Errors/AppError";

export function handleControllerError(err: any, res: Response, fallbackMessage: string) {
  
  if (err && err.details && Array.isArray(err.details) && err.details.length > 0) {
    try {
      const details = JSON.parse(err.details[0]);
      const statusCode = details.statusCode;
      const errorMessage = details.errorData?.message || fallbackMessage;

      if (statusCode >= 400 && statusCode < 500) {
        return res.status(statusCode).json({ message: errorMessage });
      } else {
        console.error('Workflow error:', err);
        return res.status(500).json({ message: fallbackMessage });
      }
    } catch (parseErr) {
      console.error('Error parsing workflow error details:', parseErr, err);
      return res.status(500).json({ message: fallbackMessage });
    }
  }

  // 2. Handle AppError
  if (err instanceof AppError) {
    if (err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ message: err.message });
    } else {
      console.error('AppError:', err);
      return res.status(500).json({ message: fallbackMessage });
    }
  }

  // 3. Handle Mongoose errors
  if (err instanceof mongoose.Error) {
    // CastError, ValidationError, etc.
    if (err.name === "CastError" || err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    } else {
      console.error('Mongoose error:', err);
      return res.status(500).json({ message: fallbackMessage });
    }
  }

  // 4. Handle generic errors with status
  if (err && typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message || fallbackMessage });
  }

  // 5. Fallback: log and send generic 500
  console.error('Unknown error:', err);
  return res.status(500).json({ message: fallbackMessage });
}
