import { z } from 'zod';

/**
 * Middleware factory to validate request parts against Zod schemas.
 * @param {Object} schemas - Object containing optional body, query, and params Zod schemas
 * @param {z.ZodSchema} [schemas.body] - Schema for req.body
 * @param {z.ZodSchema} [schemas.query] - Schema for req.query
 * @param {z.ZodSchema} [schemas.params] - Schema for req.params
 */
export function validate(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details
        });
      }
      return next(error);
    }
  };
}

export default validate;
