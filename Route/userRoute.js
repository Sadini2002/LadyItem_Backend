import express from 'express';
//import user from '../model/user.js';
import { createUser, deleteUser, getAllUsers } from '../controller/userController.js';
import { loginUser } from '../controller/userController.js';


const userRouter = express.Router();


userRouter.post('/register',  createUser);
userRouter.post('/login',  loginUser);
userRouter.get('/',  getAllUsers);
userRouter.delete('/:id',  deleteUser);




export default userRouter;  