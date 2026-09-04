import express from 'express';
import { createOrder, getOrders, updateOrder, deleteOrder } from '../Controller/odercontroller.js';

const orderRouter = express.Router();

orderRouter.get('/', getOrders);
orderRouter.post('/create', createOrder);
orderRouter.put('/:id', updateOrder);
orderRouter.delete('/:id', deleteOrder);


export default orderRouter;