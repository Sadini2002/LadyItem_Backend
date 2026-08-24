import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    default: "",
  },
  postalCode: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    required: true,
    default: "COD",
  },
  paymentStatus: {
    type: String,
    required: true,
    default: "Unpaid",
  },
  labelledTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  products: [
    {
      productInfo: {
        productId: { type: String },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        labelledPrice: { type: Number, default: 0 },
        image: { type: mongoose.Schema.Types.Mixed },
        altNames: [{ type: String }],
        description: { type: String, default: "" },
      },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

const order = mongoose.model('Order', orderSchema);


export default order;