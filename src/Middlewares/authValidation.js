import Joi from 'joi';

// Signup validation schema
export const signupValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
    phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be exactly 10 digits'
    }),
    password: Joi.string().min(8).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long'
    }),
    role: Joi.string().valid('buyer', 'seller').default('buyer').messages({
      'any.only': 'Role must be either buyer or seller'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Login validation schema
export const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    }),
    role: Joi.string().valid('buyer', 'seller').required().messages({
      'string.empty': 'Role is required',
      'any.only': 'Role must be either buyer or seller'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Validation middleware
export const validate = (validationFunction) => {
  return (req, res, next) => {
    const { error, value } = validationFunction(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    // Replace req.body with the validated data
    req.body = value;
    next();
  };
};