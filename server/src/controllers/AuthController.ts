import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import type { CreateUserData } from '../../src/types/index';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response) => {
    try {
      const { email, password, full_name, role } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({
          success: false,
          error: 'Correo electrónico, contraseña y nombre completo son requeridos.',
        });
      }

      const userData: CreateUserData = {
        email,
        password,
        full_name,
        role: role || 'student', 
      };

      const result = await this.authService.signUp(userData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en signUp:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor.',
        message: error.message,
      });
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Correo electrónico y contraseña son requeridos.',
        });
      }

      const result = await this.authService.signIn(email, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en signIn:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor.',
        message: error.message,
      });
    }
  };

  signOut = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'El token es requerido para cerrar sesión.',
        });
      }

      const result = await this.authService.signOut(token);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en signOut:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor.',
        message: error.message,
      });
    }
  };
}