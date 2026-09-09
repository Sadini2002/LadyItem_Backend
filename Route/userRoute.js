import express from 'express';
<<<<<<< HEAD
import { createUser, deleteUser, getAllUsers, getUserById, updateUser, loginUser } from '../controller/userController.js';
=======
import { createUser, deleteUser, getAllUsers, getUserById, loginUser, updateUser, loginWithGoogle} from '../Controller/userController.js';
import user from '../model/user.js';
import { getMyProfile } from '../Controller/userController.js';

>>>>>>> 30504f832f41e6c47766b3df2d2adb9fd36bfe00

const userRouter = express.Router();

userRouter.post('/register', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

<<<<<<< HEAD
export default userRouter;
=======
userRouter.post('/register',  createUser);
userRouter.post('/login',  loginUser);
userRouter.post('/login/google', loginWithGoogle);

userRouter.get('/profile', getMyProfile);
userRouter.get('/',  getAllUsers);

userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id',  deleteUser);





export default userRouter;  
>>>>>>> 30504f832f41e6c47766b3df2d2adb9fd36bfe00
