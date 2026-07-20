import express from 'express';
import { getfiveProduct, getProducts, saveProduct } from '../controller/productController.js';
import { deleteProduct ,updateProduct } from '../controller/productController.js';
import { getProductById } from '../controller/productController.js';
import { getProductByProductId } from '../controller/productController.js';


const productRouter = express.Router();

// Define product routes here
productRouter.get("/",getProducts);
productRouter.post("/", saveProduct);
productRouter.delete("/:id", deleteProduct);
productRouter.put("/:id", updateProduct);
productRouter.get("/:id", getProductById);
productRouter.get("/productId", getProductById);
productRouter.get("/productId/:productId", getProductByProductId);
productRouter.get("/featured" , getfiveProduct)

 


export default productRouter;

