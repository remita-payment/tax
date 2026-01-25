const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaxpayerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Taxpayer name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    tin: {
      type: String,
      required: [true, 'TIN is required'],
    },
    certificateNo: {
      type: String,
      required: [true, 'Certificate number is required'],
      trim: true,
      unique: true, // Added unique constraint
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: function () {
        const year = new Date().getFullYear();
        return new Date(year, 11, 31); // December 31st of current year
      }
    },
    phoneNo: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          // Valid Nigerian phone number patterns
          return /^(0[7-9][0-1]\d{8}|234[7-9][0-1]\d{8}|\+234[7-9][0-1]\d{8})$/.test(v);
        },
        message: 'Please enter a valid Nigerian phone number'
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      },
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: function () {
        // Generate 12-digit random number
        return Math.floor(100000000000 + Math.random() * 900000000000).toString();
      },
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v); // Just check it's 12 digits
        },
        message: 'Reference must be 12 digits'
      }
    },
    revenue: {
      type: String,
      default: 'Presumptive Tax'
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      set: v => parseFloat(v.toFixed(2))
    },
    platform: {
      type: String,
      default: 'REMITA'
    },
    paymentDetails: {
      type: String,
      default: 'Presumptive Tax'
    },
    idBatch: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: function () {
        // Generate 18-digit random number
        const min = 100000000000000000; // 18 digits
        const max = 999999999999999999;
        return Math.floor(min + Math.random() * (max - min + 1)).toString();
      },
      validate: {
        validator: function (v) {
          return /^\d{18}$/.test(v); // Just check it's 18 digits
        },
        message: 'ID/Batch must be 18 digits'
      }
    },
    totalIncome: {
      type: [
        {
          year: {
            type: Number,
            required: true,
            min: 2000,
            max: new Date().getFullYear()
          },
          income: {
            type: Number,
            required: true,
            min: [0, 'Income cannot be negative'],
            set: v => parseFloat(v.toFixed(2))
          },
          taxPaid: {
            type: Number,
            required: true,
            min: [0, 'Tax paid cannot be negative'],
            set: v => parseFloat(v.toFixed(2))
          }
        }
      ],
      default: []
    },
    sourceOfIncome: {
      type: String,
      required: [true, 'Source of income is required'],
      trim: true,
      maxlength: [500, 'Source of income cannot exceed 500 characters']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [1000, 'Address cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.$__;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.$__;
        return ret;
      }
    }
  }
);

// Virtual for remaining days until expiry
TaxpayerSchema.virtual('daysUntilExpiry').get(function () {
  const today = new Date();
  const expiry = this.expiryDate;
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for isExpired
TaxpayerSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryDate;
});

// Virtual for isActive (not expired)
TaxpayerSchema.virtual('isActive').get(function () {
  return new Date() <= this.expiryDate;
});

// Virtual for totalTaxPaid
TaxpayerSchema.virtual('totalTaxPaid').get(function () {
  if (!this.totalIncome || !Array.isArray(this.totalIncome)) {
    return 0;
  }
  return this.totalIncome.reduce((sum, item) => sum + (item.taxPaid || 0), 0);
});

// Virtual for totalIncomeAmount
TaxpayerSchema.virtual('totalIncomeAmount').get(function () {
  if (!this.totalIncome || !Array.isArray(this.totalIncome)) {
    return 0;
  }
  return this.totalIncome.reduce((sum, item) => sum + (item.income || 0), 0);
});

// ====== REMOVED THE PROBLEMATIC PRE-SAVE MIDDLEWARE ======
// All formatting and validation should be done in your createTaxpayer function
// instead of using middleware that causes the "next is not a function" error

// Indexes
TaxpayerSchema.index({ expiryDate: 1 });
TaxpayerSchema.index({ createdAt: -1 });
TaxpayerSchema.index({ updatedAt: -1 });
TaxpayerSchema.index({ name: 1 }); // For searching by name
TaxpayerSchema.index({ phoneNo: 1 }); // For searching by phone
TaxpayerSchema.index({ email: 1 }); // For searching by email
TaxpayerSchema.index({ amount: 1 });
TaxpayerSchema.index({ 
  name: 'text', 
  address: 'text', 
  sourceOfIncome: 'text',
  certificateNo: 'text'
});

// Query helpers (optional - remove if not needed)
TaxpayerSchema.query.active = function () {
  const today = new Date();
  return this.where({ expiryDate: { $gte: today } });
};

TaxpayerSchema.query.expired = function () {
  const today = new Date();
  return this.where({ expiryDate: { $lt: today } });
};

TaxpayerSchema.query.byTin = function (tin) {
  return this.where({ tin });
};

TaxpayerSchema.query.byReference = function (reference) {
  return this.where({ reference });
};

TaxpayerSchema.query.byCertificateNo = function (certificateNo) {
  return this.where({ certificateNo });
};

// Static methods (optional - remove if not needed)
TaxpayerSchema.statics.findByYear = function (year) {
  return this.find({
    'totalIncome.year': year,
    expiryDate: { $gte: new Date() }
  });
};

TaxpayerSchema.statics.findByAmountRange = function (min, max) {
  return this.find({
    amount: { $gte: min, $lte: max }
  });
};

// Method to format phone number (call this manually from your createTaxpayer function)
TaxpayerSchema.methods.formatPhoneNumber = function() {
  if (!this.phoneNo) return;
  
  let phone = this.phoneNo.replace(/\s+/g, '');
  
  if (phone.startsWith('+234')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('234')) {
    phone = '0' + phone.substring(3);
  }
  
  this.phoneNo = phone;
  return this.phoneNo;
};

// Method to set expiry date to year end (call this manually from your createTaxpayer function)
TaxpayerSchema.methods.setExpiryToYearEnd = function() {
  if (!this.expiryDate) {
    const year = new Date().getFullYear();
    this.expiryDate = new Date(year, 11, 31);
  } else {
    const year = new Date(this.expiryDate).getFullYear();
    this.expiryDate = new Date(year, 11, 31);
  }
  return this.expiryDate;
};

module.exports = mongoose.models.Taxpayer || mongoose.model('Taxpayer', TaxpayerSchema);