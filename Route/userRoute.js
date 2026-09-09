import express from 'express';
import { createUser, deleteUser, getAllUsers, getUserById, loginUser, updateUser, loginWithGoogle} from '../Controller/userController.js';
import user from '../model/user.js';
import { getMyProfile } from '../Controller/userController.js';


const userRouter = express.Router();


userRouter.post('/register',  createUser);
userRouter.post('/login',  loginUser);
userRouter.post('/login/google', loginWithGoogle);

userRouter.get('/profile', getMyProfile);
userRouter.get('/',  getAllUsers);

userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id',  deleteUser);





export default userRouter;  