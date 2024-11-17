import Joi from 'joi';

export const documentValidation = {
  uploadDocument: Joi.object({
    params: Joi.object({
      applicationId: Joi.string().uuid().required()
    }),
    body: Joi.object({
      type: Joi.string().valid(
        'construction_plan',
        'site_plan',
        'property_deed',
        'identification',
        'contractor_license',
        'insurance_certificate',
        'other'
      ).required(),
      metadata: Joi.object({
        pages: Joi.number().integer().min(1),
        verificationNotes: Joi.string()
      })
    })
  }),

  verifyDocument: Joi.object({
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: Joi.object({
      status: Joi.string().valid('verified', 'rejected').required(),
      notes: Joi.string().when('status', {
        is: 'rejected',
        then: Joi.required()
      })
    })
  }),

  getDocument: Joi.object({
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  }),

  deleteDocument: Joi.object({
    params: Joi.object({
      id: Joi.string().uuid().required()
    })
  })
};