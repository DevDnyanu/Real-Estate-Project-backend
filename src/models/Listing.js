import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 62,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z\s]+$/.test(v);
        },
        message: 'Name can only contain letters and spaces'
      }
    },
    description: {
      type: String,
      required: true,
      minlength: 50
    },
    address: {
      type: String,
      required: true,
      minlength: 15
    },
    type: {
      type: String,
      required: true,
      enum: ['sale', 'rent']
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    squareFootage: {
      type: Number,
      required: true,
      min: 500,
      max: 10000
    },
    contactNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Please enter a valid 10-digit phone number'
      }
    },
    regularPrice: {
      type: Number,
      required: true,
      min: 1000000,
      max: 20000000
    },
    discountPrice: {
      type: Number,
      min: 0,
      max: 20000000,
      validate: {
        validator: function(v) {
          return v < this.regularPrice;
        },
        message: 'Discount price must be less than regular price'
      }
    },
    offer: {
      type: Boolean,
      default: false
    },
    parking: {
      type: Boolean,
      default: false
    },
    furnished: {
      type: Boolean,
      default: false
    },
      userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    images: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "images.files"
    }]
},
  { timestamps: true }
);

export default mongoose.model('Listing', listingSchema);