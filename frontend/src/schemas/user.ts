import { z } from "zod";

export const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  title: z.string().max(80, "Title is too long").optional().or(z.literal("")),
});
export type EditProfileInput = z.infer<typeof editProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(10, "Use at least 10 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>;

export const organizationNameSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(120, "Name is too long"),
});
export type OrganizationNameInput = z.infer<typeof organizationNameSchema>;
