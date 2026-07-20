import Product from "../model/product.js";
import { isAdmin } from "./userController.js";

// GET ALL PRODUCTS
export async function getProducts(req, res) {
  
  

  try {
    if (isAdmin(req)) {
      const products = await Product.find();
      return res.json(products);
    } else {
      const products = await Product.find({ isAvailable: true });
      return res.json(products);
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to get products",
      error: err.message,
    });
  }
}


// CREATE PRODUCT
export async function saveProduct(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can create product" });
  }

  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    res.json({ message: "Product created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating product", error: err });
  }
}

// DELETE PRODUCT
export async function deleteProduct(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can delete product" });
  }
try {
    const id = req.params.id;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });}

      return res.json({ message: "Product deleted successfully" });
    
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err });
  }
}

// UPDATE PRODUCT
export async function updateProduct(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can update product" });
  }

  try {
    const id = req.params.id;

    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server Error", error: err });
  }
}

// GET PRODUCT BY ID
export async function getProductById(req, res) {
    const id = req.params.Productid;

    try {
        const foundProduct = await Product.findById(id); // Use _id from MongoDB
        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (!foundProduct.isAvailable && !isAdmin(req)) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.json(foundProduct);
    } catch (err) {
        res.status(500).json({
            message: "Internal server Error",
            error: err.message,
        });
    }
}


export async function getProductByProductId(req, res) {
  const productId = req.params.productId;

  try {
    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
}

export async function getfiveProduct(req,res){
  try {
    const products = await Product
      .find({ isAvailable: true })
      .sort({ createdAt: -1 }) // latest first (optional)
      .limit(5);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
}


