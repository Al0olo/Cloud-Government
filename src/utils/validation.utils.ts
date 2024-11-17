import Joi from 'joi';

export const customValidationMessages = {
  required: '{{#label}} is required',
  'string.email': 'Please provide a valid email address',
  'string.min': '{{#label}} must be at least {{#limit}} characters long',
  'string.max': '{{#label}} must be at most {{#limit}} characters long',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must be at most {{#limit}}',
  'any.only': '{{#label}} must match {{#ref}}',
  'string.pattern.base': 'Invalid format for {{#label}}'
};

export const commonValidations = {
  email: Joi.string()
    .email()
    .required()
    .messages(customValidationMessages),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      ...customValidationMessages,
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]{10,}$/)
    .required()
    .messages({
      ...customValidationMessages,
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  uuid: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages(customValidationMessages),

  pagination: {
    page: Joi.number()
      .min(1)
      .default(1),
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(10)
  }
};

export const validateSchema = (
  data: any,
  schema: Joi.Schema,
  options: Joi.ValidationOptions = {}
) => {
  const defaultOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  };

  const { error, value } = schema.validate(data, {
    ...defaultOptions,
    ...options
  });

  if (error) {
    const validationErrors: Record<string, string> = {};
    error.details.forEach((detail) => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    return { error: validationErrors };
  }

  return { value };
};