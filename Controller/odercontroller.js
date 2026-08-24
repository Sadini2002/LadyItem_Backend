import Order from "../model/order.js";
import Product from "../model/product.js";

// ==========================================
// CREATE ORDER
// ==========================================
export async function createOrder(req, res) {
  try {
    // ------------------------------------------
    // 1. Check authorization
    // ------------------------------------------
    if (!req.user) {
      return res.status(403).json({
        message:
          "You are not authorized to create an order. Please login and try again",
      });
    }

    // ------------------------------------------
    // 2. Get order information
    // ------------------------------------------
    const orderInfo = {
      ...req.body,
    };

    // ------------------------------------------
    // 3. Add user name if not provided
    // ------------------------------------------
    if (!orderInfo.name) {
      const firstName = req.user.firstname || "";
      const lastName = req.user.lastname || "";

      orderInfo.name =
        `${firstName} ${lastName}`.trim() ||
        req.user.email;
    }

    // ------------------------------------------
    // 4. Generate order ID
    // ------------------------------------------
   // ==========================================
// Generate unique order ID
// ==========================================
let orderId;

const lastOrder = await Order.findOne({
  orderId: /^CBC\d+$/,
}).sort({
  orderId: -1,
});

let nextNumber = 1;

if (lastOrder && lastOrder.orderId) {
  const match =
    lastOrder.orderId.match(/^CBC(\d+)$/);

  if (match) {
    nextNumber =
      parseInt(match[1], 10) + 1;
  }
}

orderId =
  "CBC" +
  nextNumber
    .toString()
    .padStart(5, "0");

// Make sure the generated ID is unique
while (
  await Order.exists({ orderId })
) {
  nextNumber++;

  orderId =
    "CBC" +
    nextNumber
      .toString()
      .padStart(5, "0");
}
    // ------------------------------------------
    // 5. Determine payment method
    // ------------------------------------------
    const paymentMethod =
      orderInfo.paymentMethod || "COD";

    // ------------------------------------------
    // 6. Determine payment status
    // ------------------------------------------
    let paymentStatus =
      orderInfo.paymentStatus;

    if (!paymentStatus) {
      if (
        paymentMethod === "card" ||
        paymentMethod === "easypaisa"
      ) {
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Unpaid";
      }
    }

    // ------------------------------------------
    // 7. Prepare products
    // ------------------------------------------
    let total = 0;
    let labelledTotal = 0;

    const products = [];

    if (
      !Array.isArray(orderInfo.products) ||
      orderInfo.products.length === 0
    ) {
      return res.status(400).json({
        message: "Order must contain at least one product",
      });
    }

    // ------------------------------------------
    // 8. Process every product
    // ------------------------------------------
    for (const p of orderInfo.products) {
      // Support both:
      // productId = P013
      // OR
      // _id = MongoDB ObjectId

      const pId =
        p.productId || p._id;

      if (!pId) {
        return res.status(400).json({
          message:
            "Product ID is missing from order",
        });
      }

      let item = null;

      // ----------------------------------------
      // First search using custom productId
      // Example: P013
      // ----------------------------------------
      item = await Product.findOne({
        productId: pId,
      });

      // ----------------------------------------
      // If not found, check whether pId is a
      // valid MongoDB ObjectId
      // ----------------------------------------
      if (
        !item &&
        /^[0-9a-fA-F]{24}$/.test(
          String(pId)
        )
      ) {
        item =
          await Product.findById(pId);
      }

      // ----------------------------------------
      // Product doesn't exist
      // ----------------------------------------
      if (!item) {
        return res.status(404).json({
          message:
            `Product not found: ${pId}`,
        });
      }

      // ----------------------------------------
      // Quantity
      // ----------------------------------------
      const quantity =
        Number(p.quantity) || 1;

      if (quantity < 1) {
        return res.status(400).json({
          message:
            `Invalid quantity for product ${pId}`,
        });
      }

      // ----------------------------------------
      // Product price
      // ----------------------------------------
      const itemPrice =
        Number(item.price) || 0;

      // ----------------------------------------
      // Labelled price
      //
      // Supports both:
      // labelledPrice
      // labalPrice
      // ----------------------------------------
      const itemLabelledPrice =
        Number(
          item.labelledPrice ??
            item.labalPrice ??
            item.price
        ) || 0;

      // ----------------------------------------
      // Product information
      // ----------------------------------------
      const itemName =
        item.name ||
        p.name ||
        "Product Item";

      const itemImage =
        item.image ||
        p.image ||
        null;

      const itemDescription =
        item.description ||
        p.description ||
        "";

      // ----------------------------------------
      // Add product to order
      // ----------------------------------------
      products.push({
        productInfo: {
          productId:
            item.productId || pId,

          name: itemName,

          price: itemPrice,

          labelledPrice:
            itemLabelledPrice,

          image: itemImage,

          description:
            itemDescription,
        },

        quantity,
      });

      // ----------------------------------------
      // Calculate totals
      // ----------------------------------------
      total +=
        itemPrice * quantity;

      labelledTotal +=
        itemLabelledPrice *
        quantity;
    }

    // ------------------------------------------
    // 9. Use frontend grandTotal if provided
    // ------------------------------------------
    if (
      orderInfo.grandTotal !==
        undefined &&
      orderInfo.grandTotal !== null &&
      Number(orderInfo.grandTotal) >= 0
    ) {
      total =
        Number(orderInfo.grandTotal);
    }

    // ------------------------------------------
    // 10. Create new order
    // ------------------------------------------
    const newOrder = new Order({
      orderId,

      email:
        req.user.email,

      name:
        orderInfo.name,

      address:
        orderInfo.address || "",

      city:
        orderInfo.city || "",

      postalCode:
        orderInfo.postalCode || "",

      phone:
        orderInfo.phone || "",

      status:
        "Pending",

      paymentMethod,

      paymentStatus,

      products,

      labelledTotal:
        labelledTotal || total,

      total,
    });

    // ------------------------------------------
    // 11. Save order
    // ------------------------------------------
    const createdOrder =
      await newOrder.save();

    // ------------------------------------------
    // 12. Return successful response
    // ------------------------------------------
    return res.status(201).json({
      message:
        "Order created successfully",

      orderId:
        createdOrder.orderId,

      order:
        createdOrder,
    });
  } catch (err) {
    // ------------------------------------------
    // ERROR HANDLING
    // ------------------------------------------
    console.error(
      "Create order error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to create order",

      error:
        err.message,
    });
  }
}

// ==========================================
// GET ORDERS
// ==========================================
export async function getOrders(
  req,
  res
) {
  try {
    // ------------------------------------------
    // Check authorization
    // ------------------------------------------
    if (!req.user) {
      return res.status(403).json({
        message:
          "Unauthorized",
      });
    }

    let orders;

    // ------------------------------------------
    // Admin gets all orders
    // ------------------------------------------
    if (
      req.user.role === "admin"
    ) {
      orders =
        await Order.find().sort({
          date: -1,
        });
    }

    // ------------------------------------------
    // Normal user gets only their orders
    // ------------------------------------------
    else {
      orders =
        await Order.find({
          email:
            req.user.email,
        }).sort({
          date: -1,
        });
    }

    return res.json(orders);
  } catch (err) {
    console.error(
      "Get orders error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to get orders",

      error:
        err.message,
    });
  }
}

// ==========================================
// UPDATE ORDER
// ==========================================
export async function updateOrder(
  req,
  res
) {
  try {
    // ------------------------------------------
    // Only admin can update orders
    // ------------------------------------------
    if (
      !req.user ||
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only admin can update order",
      });
    }

    const id =
      req.params.id;

    const {
      status,
      paymentStatus,
    } = req.body;

    // ------------------------------------------
    // Build update object
    // ------------------------------------------
    const updateFields = {};

    if (status) {
      updateFields.status =
        status;
    }

    if (paymentStatus) {
      updateFields.paymentStatus =
        paymentStatus;
    }

    // ------------------------------------------
    // Update order
    // ------------------------------------------
    const updatedOrder =
      await Order.findByIdAndUpdate(
        id,
        updateFields,
        {
          new: true,
        }
      );

    // ------------------------------------------
    // Order not found
    // ------------------------------------------
    if (!updatedOrder) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }

    // ------------------------------------------
    // Successful response
    // ------------------------------------------
    return res.json({
      message:
        "Order updated successfully",

      order:
        updatedOrder,
    });
  } catch (err) {
    console.error(
      "Update order error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to update order",

      error:
        err.message,
    });
  }
}