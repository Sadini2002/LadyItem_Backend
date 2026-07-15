import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    altname: [{
        type: String,
    }],
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
    },
    labelPrice: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,

    },
    isAvailable: {
        type: Boolean,
        required: true,
        default: true,
    }

  })