// ─── middleware/validate.js ────────────────────────────────────────────────────
// Owned by M1 — Zod validation wrapper for request body/params/query

const { ZodError } = require('zod');

/**
 * Validate req.body against a Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const result = schema.parse(req[source]);
    req[source]  = result; // replace with parsed (trimmed, coerced) data
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    next(err);
  }
};

module.exports = validate;
