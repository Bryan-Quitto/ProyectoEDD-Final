import { Request, Response } from 'express';
import { ModuleSupportResourceService } from '../services/moduleSupportResourceService';

const resourceService = new ModuleSupportResourceService();

export const ModuleSupportResourceController = {
  async getByModule(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const result = await resourceService.getResourcesByModule(moduleId);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const result = await resourceService.createResource(req.body);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(201).json(result);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { resourceId } = req.params;
    const result = await resourceService.deleteResource(resourceId);
    if (result.error) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  }
};