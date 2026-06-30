import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export type ValidationSource = 'body' | 'params' | 'query';

export const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    // Replace with parsed (coerced/trimmed) data
    req[source] = result.data;
    next();
  };
};
