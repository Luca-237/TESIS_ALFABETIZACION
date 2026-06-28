/**
 * @module middlewares/authMiddleware
 * @description Middleware centralizado de autenticación.
 * 
 * Si USE_MOCK_AUTH=true en .env, inyecta un usuario ficticio para pruebas
 * sin necesidad de tener Clerk configurado. En producción usa requireAuth() de Clerk.
 */
import { requireAuth } from '@clerk/express';

/**
 * Middleware mock que simula la autenticación de Clerk.
 * Inyecta un userId fijo en req.auth para pruebas locales.
 */
const mockRequireAuth = () => {
  return (req, res, next) => {
    req.auth = { userId: 'user_prueba_123' };
    next();
  };
};

/**
 * Middleware de autenticación unificado.
 * Usa mock en desarrollo (USE_MOCK_AUTH=true) o Clerk en producción.
 */
const authMiddleware = process.env.USE_MOCK_AUTH === 'true'
  ? mockRequireAuth()
  : requireAuth();

export default authMiddleware;
