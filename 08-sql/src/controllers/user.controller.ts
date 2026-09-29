import { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export class UserController {
  static async getAll(req: Request, res: Response): Promise<void> {
    const users = await UserModel.findAll();
    res.json(users);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const user = await UserModel.create(req.body);
    res.status(201).json(user);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const user = await UserModel.update(id, req.body);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const deleted = await UserModel.delete(id);

    if (!deleted) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(204).send();
  }
}
