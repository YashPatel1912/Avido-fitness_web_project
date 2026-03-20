import { z } from "zod";

const email = z
  .string()
  .trim()
  .email({ message: "Please enter a valid email address." });

const password = z
  .string()
  .trim()
  .min(6, { message: "Password must be at least 6 characters." })
  .max(16, { message: "Password must not exceed 16 characters." });

const userName = z
  .string()
  .trim()
  .min(3, { message: "Name must be at least 3 characters." })
  .max(100, { message: "Name must not exceed 100 characters." });

const newPassword = z
  .string()
  .min(6, { message: "New password must be at least 6 characters." })
  .max(16, { message: "New password must not exceed 16 characters." });

const confirmPassword = z
  .string()
  .min(6, { message: "Confirm password must be at least 6 characters." })
  .max(16, { message: "Confirm password must not exceed 16 characters." });

export const loginSchema = z.object({
  email: email,
  password: password,
});

export const registerSchema = z.object({
  userName: userName,
  email: email,
  password: password,
});

export const contactSchema = z.object({
  name: userName,
  email: email,
  message: z.string().trim().min(1, { message: "Message cannot be empty." }),
});

export const personalDetailsSchema = z.object({
  fullName: userName,
  email: email,
  phone: z.string().regex(/^[0-9]{10}$/, {
    message: "Phone number must be exactly 10 digits.",
  }),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters long." }),
  city: z
    .string()
    .min(2, { message: "City name must be at least 2 characters." }),
  pinCode: z
    .string()
    .regex(/^[0-9]{6}$/, { message: "PIN code must be exactly 6 digits." }),
  state: z
    .string()
    .min(2, { message: "State name must be at least 2 characters." }),
});

export const paymentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Cardholder name must be at least 3 characters." }),

  cardNumaber: z.string().regex(/^[0-9]{12,19}$/, {
    message: "Card number must be between 12 and 19 digits.",
  }),

  cvv: z
    .string()
    .regex(/^[0-9]{3,4}$/, { message: "CVV must be 3 or 4 digits." }),

  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Expiry date must be in YYYY-MM-DD format.",
  }),

  stripId: z.string().min(1, { message: "Stripe ID is required." }),
});

export const changePassword = z
  .object({
    currentPassword: password,
    newPassword: newPassword,
    confirmPassword: confirmPassword,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: email,
});

export const resetPasswordSchema = z
  .object({
    newPassword: newPassword,
    confirmPassword: confirmPassword,
    email: email,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const setPasswordSchema = z.object({
  password: password,
  email: email,
});
