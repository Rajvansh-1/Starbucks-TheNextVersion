import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: 'customer' | 'admin' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    dietaryRestrictions: string[];
    favoriteStores: string[];
  };
  rewards: {
    stars: number;
    level: 'green' | 'gold';
    totalSpent: number;
    joinDate: Date;
  };
  addresses: Array<{
    _id?: string;
    type: 'home' | 'work' | 'other';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past',
    },
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  profileImage: {
    type: String,
    default: null,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'staff'],
    default: 'customer',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'soy-allergy'],
    }],
    favoriteStores: [{
      type: Schema.Types.ObjectId,
      ref: 'Store',
    }],
  },
  rewards: {
    stars: {
      type: Number,
      default: 0,
      min: [0, 'Stars cannot be negative'],
    },
    level: {
      type: String,
      enum: ['green', 'gold'],
      default: 'green',
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative'],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      required: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'United States',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'rewards.level': 1 });
userSchema.index({ status: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update rewards level
userSchema.methods.updateRewardsLevel = function () {
  if (this.rewards.totalSpent >= 300) {
    this.rewards.level = 'gold';
  } else {
    this.rewards.level = 'green';
  }
};

export const User = mongoose.model<IUser>('User', userSchema);
