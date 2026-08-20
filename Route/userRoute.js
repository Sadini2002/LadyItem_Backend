import express from 'express';
//import user from '../model/user.js';
import { createUser, deleteUser, getAllUsers , getUserById} from '../controller/userController.js';
import { loginUser } from '../controller/userController.js';
import { updateUser } from '../controller/userController.js';
import user from '../model/user.js';


const userRouter = express.Router();


userRouter.post('/register',  createUser);
userRouter.post('/login',  loginUser);
userRouter.get('/',  getAllUsers);
userRouter.delete('/:id',  deleteUser);
userRouter.get("/users/:id", getUserById);
userRouter.put("/users/:id", updateUser);




export default userRouter;  