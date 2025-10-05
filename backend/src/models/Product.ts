import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  category: 'coffee' | 'tea' | 'food' | 'merchandise' | 'gift-cards';
  subcategory: string;
  price: number;
  originalPrice?: number;
  images: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    sodium: number;
    caffeine?: number;
  };
  ingredients: string[];
  allergens: string[];
  dietaryInfo: string[];
  size: 'tall' | 'grande' | 'venti' | 'trenta' | 'one-size';
  customization: {
    milk: string[];
    syrup: string[];
    toppings: string[];
    temperature: string[];
  };
  availability: {
    isAvailable: boolean;
    stores: string[];
    onlineOrder: boolean;
  };
  popularity: {
    views: number;
    orders: number;
    rating: number;
    reviews: number;
  };
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  isSeasonal: boolean;
  season?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['coffee', 'tea', 'food', 'merchandise', 'gift-cards'],
  },
  subcategory: {
    type: String,
    required: [true, 'Product subcategory is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
  },
  images: [{
    type: String,
    required: true,
  }],
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
    caffeine: { type: Number, min: 0 },
  },
  ingredients: [{
    type: String,
    trim: true,
  }],
  allergens: [{
    type: String,
    enum: ['milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 'wheat', 'soybeans'],
  }],
  dietaryInfo: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'],
  }],
  size: {
    type: String,
    enum: ['tall', 'grande', 'venti', 'trenta', 'one-size'],
    default: 'grande',
  },
  customization: {
    milk: [{
      type: String,
      enum: ['whole-milk', '2-percent', 'nonfat', 'soy', 'almond', 'coconut', 'oat', 'lactose-free'],
    }],
    syrup: [{
      type: String,
      enum: ['vanilla', 'caramel', 'hazelnut', 'cinnamon', 'peppermint', 'toffee-nut'],
    }],
    toppings: [{
      type: String,
      enum: ['whipped-cream', 'caramel-drizzle', 'chocolate-drizzle', 'cinnamon-powder', 'nutmeg'],
    }],
    temperature: [{
      type: String,
      enum: ['hot', 'iced', 'blended'],
    }],
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stores: [{
      type: Schema.Types.ObjectId,
      ref: 'Store',
    }],
    onlineOrder: {
      type: Boolean,
      default: true,
    },
  },
  popularity: {
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
  isSeasonal: {
    type: Boolean,
    default: false,
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'popularity.rating': -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ isSeasonal: 1 });
productSchema.index({ 'availability.isAvailable': 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Method to increment views
productSchema.methods.incrementViews = function () {
  this.popularity.views += 1;
  return this.save();
};

// Method to update rating
productSchema.methods.updateRating = function (newRating: number) {
  const totalReviews = this.popularity.reviews;
  const currentRating = this.popularity.rating;
  const newTotalRating = (currentRating * totalReviews + newRating) / (totalReviews + 1);

  this.popularity.rating = Math.round(newTotalRating * 10) / 10;
  this.popularity.reviews += 1;

  return this.save();
};

export const Product = mongoose.model<IProduct>('Product', productSchema);
