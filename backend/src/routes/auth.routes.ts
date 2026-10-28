import { Router } from 'express';
import { handleRegister, handleLogin, handleGetMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/require-auth';

export const authRouter: Router = Router();

authRouter.post('/register', handleRegister);
authRouter.post('/login', handleLogin);
authRouter.get('/me', requireAuth, handleGetMe);
