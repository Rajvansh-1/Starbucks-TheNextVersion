import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  user: string;
  items: Array<{
    product: string;
    quantity: number;
    size: string;
    customizations: {
      milk?: string;
      syrup?: string[];
      toppings?: string[];
      temperature?: string;
      specialInstructions?: string;
    };
    price: number;
    totalPrice: number;
  }>;
  store?: string;
  orderType: 'pickup' | 'delivery' | 'dine-in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'rewards' | 'gift-card';
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee?: number;
  total: number;
  rewardsEarned: number;
  rewardsUsed: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  pickupTime?: Date;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      required: true,
      enum: ['tall', 'grande', 'venti', 'trenta', 'one-size'],
    },
    customizations: {
      milk: {
        type: String,
        enum: ['whole-milk', '2-percent', 'nonfat', 'soy', 'almond', 'coconut', 'oat', 'lactose-free'],
      },
      syrup: [{
        type: String,
        enum: ['vanilla', 'caramel', 'hazelnut', 'cinnamon', 'peppermint', 'toffee-nut'],
      }],
      toppings: [{
        type: String,
        enum: ['whipped-cream', 'caramel-drizzle', 'chocolate-drizzle', 'cinnamon-powder', 'nutmeg'],
      }],
      temperature: {
        type: String,
        enum: ['hot', 'iced', 'blended'],
      },
      specialInstructions: {
        type: String,
        maxlength: [200, 'Special instructions cannot exceed 200 characters'],
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
  },
  orderType: {
    type: String,
    required: true,
    enum: ['pickup', 'delivery', 'dine-in'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'cash', 'rewards', 'gift-card'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
  },
  tip: {
    type: Number,
    default: 0,
    min: 0,
  },
  deliveryFee: {
    type: Number,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  rewardsEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  rewardsUsed: {
    type: Number,
    default: 0,
    min: 0,
  },
  deliveryAddress: {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'United States',
    },
    instructions: {
      type: String,
      maxlength: [200, 'Delivery instructions cannot exceed 200 characters'],
    },
  },
  pickupTime: {
    type: Date,
  },
  estimatedReadyTime: {
    type: Date,
  },
  actualReadyTime: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SB${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to calculate estimated ready time
orderSchema.methods.calculateEstimatedReadyTime = function () {
  const baseTime = 5; // 5 minutes base
  const itemTime = this.items.length * 2; // 2 minutes per item
  const customizationsTime = this.items.reduce((total: number, item: any) => {
    return total + (item.customizations.syrup?.length || 0) + (item.customizations.toppings?.length || 0);
  }, 0) * 0.5; // 30 seconds per customization

  const totalMinutes = baseTime + itemTime + customizationsTime;
  this.estimatedReadyTime = new Date(Date.now() + totalMinutes * 60000);

  return this.estimatedReadyTime;
};

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus: string) {
  this.status = newStatus;

  if (newStatus === 'ready') {
    this.actualReadyTime = new Date();
  }

  return this.save();
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);
