// ─── validators/authValidator.js ──────────────────────────────────────────────
// M1 Owned — Zod Validation Schemas for Authentication

const { z } = require('zod');

const GU_DOMAINS = ['@geeta.ac.in', '@geetauniversity.ac.in', '@geetauniversity.edu.in'];
const isGUEmail = (email) => GU_DOMAINS.some(d => email.toLowerCase().endsWith(d));

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(50).trim(),
  email:    z.string().email('Invalid email address').toLowerCase().trim()
    .refine(isGUEmail, {
      message: 'Only Geeta University email addresses are allowed (@geeta.ac.in / @geetauniversity.ac.in / @geetauniversity.edu.in)',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone:    z.string().optional().default(''),
  role:     z.enum(['student', 'faculty', 'admin']).optional().default('student'),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email address').toLowerCase().trim()
    .refine(isGUEmail, {
      message: 'Only Geeta University email addresses are allowed',
    }),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
