import Joi from 'joi';
import { commonValidations } from '../utils/validation.utils';

export const userValidation = {
  updateProfile: Joi.object({
    body: Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      phone: commonValidations.phone,
      notificationPreferences: Joi.object({
        email: Joi.boolean(),
        sms: Joi.boolean(),
        applicationUpdates: Joi.boolean(),
        documentRequests: Joi.boolean(),
        statusChanges: Joi.boolean(),
        generalAnnouncements: Joi.boolean()
      })
    }).min(1)
  }),

  changePassword: Joi.object({
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonValidations.password,
      confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({ 'any.only': 'Passwords must match' })
    })
  })
};
