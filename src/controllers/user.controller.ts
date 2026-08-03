import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const user = await UserService.getUserById(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const user = await UserService.updateProfile(req.user.userId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string | undefined;

      const result = await UserService.listUsers(page, limit, search);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await UserService.updateUserRole(id, role);
      res.status(200).json({
        status: 'success',
        message: 'User role updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
