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
      const first = req.user.firstname || "";
      const last = req.user.lastname || "";
      orderInfo.name = `${first} ${last}`.trim() || req.user.email;
    }

    // Generate orderId
    let orderId = "CBC00001";
    const lastOrder = await Order.findOne().sort({ date: -1 });

    if (lastOrder && lastOrder.orderId) {
      const lastOrderId = lastOrder.orderId; // e.g., "CBC00001"
      const lastOrderNumber = parseInt(lastOrderId.replace("CBC", "")) || 0;
      const newOrderNumber = lastOrderNumber + 1;
      orderId = "CBC" + newOrderNumber.toString().padStart(5, "0");
    }

    // Determine payment status
    const paymentMethod = orderInfo.paymentMethod || "COD";
    let paymentStatus = orderInfo.paymentStatus;
    if (!paymentStatus) {
      if (paymentMethod === "card" || paymentMethod === "easypaisa") {
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Unpaid";
      }
    }

    // Calculate totals and build products array
    let total = 0;
    let labelledTotal = 0;
    const products = [];

    if (Array.isArray(orderInfo.products)) {
      for (let i = 0; i < orderInfo.products.length; i++) {
        const p = orderInfo.products[i];
        const pId = p.productId || p._id;

        let item = null;
        if (pId) {
          item = await Product.findOne({
            $or: [{ productId: pId }, { _id: pId }],
          });
        }

        const qty = Number(p.quantity) || 1;
        const itemPrice = item ? item.price : Number(p.price || 0);
        const itemLabelledPrice = item ? (item.labalPrice || item.labelledPrice || item.price) : Number(p.price || 0);
        const itemName = item ? item.name : (p.name || "Product Item");
        const itemImg = item ? item.image : (p.image || null);
        const itemDesc = item ? (item.description || "") : (p.description || "");

        products.push({
          productInfo: {
            productId: pId || (item ? item.productId : ""),
            name: itemName,
            price: itemPrice,
            labelledPrice: itemLabelledPrice,
            image: itemImg,
            description: itemDesc,
          },
          quantity: qty,
        });

        total += itemPrice * qty;
        labelledTotal += itemLabelledPrice * qty;
      }
    }

    // If client supplied grandTotal (e.g. including shipping/discounts), respect grandTotal
    if (orderInfo.grandTotal && Number(orderInfo.grandTotal) > 0) {
      total = Number(orderInfo.grandTotal);
    }

    // Create new order
    const newOrder = new Order({
      orderId: orderId,
      email: req.user.email,
      name: orderInfo.name,
      address: orderInfo.address || "",
      city: orderInfo.city || "",
      postalCode: orderInfo.postalCode || "",
      phone: orderInfo.phone || "",
      status: "Pending",
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      products: products,
      labelledTotal: labelledTotal || total,
      total: total,
    });

    const createdOrder = await newOrder.save();

    return res.status(201).json({
      message: "Order created successfully",
      orderId: createdOrder.orderId,
      order: createdOrder,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getOrders(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let orders;
    if (req.user.role === "admin") {
      orders = await Order.find().sort({ date: -1 });
    } else {
      orders = await Order.find({ email: req.user.email }).sort({ date: -1 });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to get orders", error: err.message });
  }
}

export async function updateOrder(req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update order" });
    }
    const id = req.params.id;
    const { status, paymentStatus } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const updatedOrder = await Order.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
}