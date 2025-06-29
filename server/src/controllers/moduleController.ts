import type { Request, Response } from 'express';
import { ModuleService } from '../services/moduleService';

export const ModuleController = {
  async createModule(req: Request, res: Response) {
    try {
      const newModule = await ModuleService.create(req.body);
      res.status(201).json(newModule);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },

  async getModulesByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const modules = await ModuleService.getByCourseId(courseId);
      res.status(200).json(modules);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },

  async getModuleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const module = await ModuleService.getById(id);
      if (module) {
        res.status(200).json(module);
      } else {
        res.status(404).json({ message: 'Módulo no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },

  async updateModule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedModule = await ModuleService.update(id, req.body);
      res.status(200).json(updatedModule);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  },

  async deleteModule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedModule = await ModuleService.remove(id);
      res.status(200).json({ message: 'Módulo eliminado exitosamente', data: deletedModule });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
};