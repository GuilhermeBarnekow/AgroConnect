const Joi = require('joi');

const schemas = {
  createOffer: Joi.object({
    announcementId: Joi.string().uuid().required(),
    price: Joi.number().positive().required(),
    message: Joi.string().allow('').optional(),
  }),
  updateOfferStatus: Joi.object({
    status: Joi.string().valid('accepted', 'rejected', 'completed').required(),
  }),
  counterOffer: Joi.object({
    price: Joi.number().positive().required(),
    message: Joi.string().allow('').optional(),
  }),
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).optional(),
    offset: Joi.number().integer().min(0).optional(),
  }),
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      error: error.details[0].message,
    });
  }
  next();
};

module.exports = { schemas, validate };
