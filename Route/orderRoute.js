import express from 'express';
import { createOrder } from '../controller/odercontroller.js';

const orderRouter = express.Router();

orderRouter.post('/create', createOrder);

export default orderRouter;