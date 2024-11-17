import Joi from 'joi';

export const applicationValidation = {
  createApplication: Joi.object({
    type: Joi.string()
      .valid('building_permit', 'business_license', 'planning_permit', 'zoning_request')
      .required(),
    data: Joi.object({
      projectType: Joi.string().required(),
      projectDescription: Joi.string().required(),
      estimatedCost: Joi.number().min(0).required(),
      startDate: Joi.date().greater('now').required(),
      propertyAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().length(2).required(),
        zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required()
      }).required(),
      parcelNumber: Joi.string().required(),
      zoneType: Joi.string().required(),
      applicant: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).required(),
        isOwner: Joi.boolean().required()
      }).required(),
      contractor: Joi.object({
        companyName: Joi.string().required(),
        licenseNumber: Joi.string().required(),
        contactName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).required()
      }).required()
    }).required()
  }),

  updateApplication: Joi.object({
    data: Joi.object(),
    status: Joi.string().valid(
      'draft',
      'submitted',
      'under_review',
      'information_required',
      'approved',
      'rejected'
    )
  }).min(1),

  getApplications: Joi.object({
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(100),
    status: Joi.string(),
    type: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date().greater(Joi.ref('startDate'))
  }),

  getApplication: Joi.object({
    id: Joi.string().uuid().required()
  }),

  deleteApplication: Joi.object({
    id: Joi.string().uuid().required()
  }),

  uploadDocuments: Joi.object({
    id: Joi.string().uuid().required(),
    type: Joi.string().valid(
      'construction_plan',
      'site_plan',
      'property_deed',
      'identification',
      'other'
    ).required()
  }),

  deleteDocument: Joi.object({
    id: Joi.string().uuid().required(),
    documentId: Joi.string().uuid().required()
  }),

  updateStatus: Joi.object({
    id: Joi.string().uuid().required(),
    status: Joi.string().valid(
      'under_review',
      'information_required',
      'approved',
      'rejected'
    ).required(),
    notes: Joi.string()
  })
};