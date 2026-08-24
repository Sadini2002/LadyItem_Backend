import express from 'express';
import { createOrder, getOrders, updateOrder } from '../Controller/odercontroller.js';

const orderRouter = express.Router();

orderRouter.get('/', getOrders);
orderRouter.post('/create', createOrder);
orderRouter.put('/:id', updateOrder);


export default orderRouter;