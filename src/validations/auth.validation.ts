import Joi from 'joi';

export const authValidation = {
  register: Joi.object({
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required'
        }),
      firstName: Joi.string()
        .required()
        .messages({
          'any.required': 'First name is required'
        }),
      lastName: Joi.string()
        .required()
        .messages({
          'any.required': 'Last name is required'
        }),
      phone: Joi.string()
        .pattern(/^\+?[\d\s-()]{10,}$/)
        .required()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number',
          'any.required': 'Phone number is required'
        })
    })
  }),

  login: Joi.object({
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required'
        })
    })
  }),

  forgotPassword: Joi.object({
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        })
    })
  }),

  resetPassword: Joi.object({
    body: Joi.object({
      token: Joi.string()
        .required()
        .messages({
          'any.required': 'Reset token is required'
        }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
          'any.only': 'Passwords must match',
          'any.required': 'Password confirmation is required'
        })
    })
  }),

  changePassword: Joi.object({
    body: Joi.object({
      currentPassword: Joi.string()
        .required()
        .messages({
          'any.required': 'Current password is required'
        }),
      newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'New password is required'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
          'any.only': 'Passwords must match',
          'any.required': 'Password confirmation is required'
        })
    })
  })
};