import Order from "../model/order.js";
import Product from "../model/product.js";

export async function createOrder(req, res) {
  try {
    // Authorization
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create an order. Please login and try again" });
    }

    // Get order info
    let orderInfo = req.body;

    // Add current user's name if not provided
    if (!orderInfo.name) {
      orderInfo.name = `${req.user.firstname} ${req.user.lastname}`;
    }

    // Generate orderId
    let orderId = "CBC00001";
    const lastOrder = await Order.findOne().sort({ createdAt: -1 }); // requires timestamps in schema

    if (lastOrder) {
      const lastOrderId = lastOrder.orderId; // e.g., "CBC00001"
      const lastOrderNumber = parseInt(lastOrderId.replace("CBC", ""));
      const newOrderNumber = lastOrderNumber + 1;
      orderId = "CBC" + newOrderNumber.toString().padStart(5, "0");
    }

    // Calculate totals and build products array
    let total = 0;
    let labelledTotal = 0;
    const products = [];

    for (let i = 0; i < orderInfo.products.length; i++) {
      const p = orderInfo.products[i];
      const item = await Product.findOne({ productId: p.productId });

      if (!item) {
        return res.status(404).json({ message: `Product with ID ${p.productId} not found` });
      }

      if (item.isAvailable === false) {
        return res.status(400).json({ message: `Product with ID ${p.productId} is not available` });
      }

      const qty = Number(p.quantity) || 0;

      products.push({
        productInfo: {
          productId: item.productId,
          name: item.name,
          price: item.price,
          altNames: item.altNames,
          description: item.description,
          labelledPrice: item.labelledPrice,
          image: item.image,
        },
        qty,
      });

      total += item.price * qty;
      labelledTotal += (item.labelledPrice || 0) * qty;
    }

    // Create new order
    const newOrder = new Order({
      orderId,
      name: orderInfo.name,
      email: req.user.email,
      address: orderInfo.address,
      phone: orderInfo.phone,
      products,
      labelledTotal,
      total,
    });

    const createdOrder = await newOrder.save();

    return res.status(201).json({
      message: "Order created successfully",
      orderId: createdOrder.orderId,
      order: createdOrder,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getOrders(req, res) {
 
 }