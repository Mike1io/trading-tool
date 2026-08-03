import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search/search.service.js';

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || (req.query.query as string) || '';
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

      const results = await SearchService.search(query, limit);

      res.status(200).json({
        status: 'success',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
