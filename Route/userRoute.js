import express from 'express';
import { createUser, deleteUser, getAllUsers, getUserById, loginUser, updateUser } from '../Controller/userController.js';
import user from '../model/user.js';


const userRouter = express.Router();


userRouter.post('/register',  createUser);
userRouter.post('/login',  loginUser);
userRouter.get('/',  getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id',  deleteUser);




export default userRouter;  