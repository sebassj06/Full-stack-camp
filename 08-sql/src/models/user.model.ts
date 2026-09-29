export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserModel {
  static async findAll(): Promise<User[]> {
    throw new Error("Not implemented");
  }

  static async findById(id: number): Promise<User | null> {
    throw new Error("Not implemented");
  }

  static async create(data: Omit<User, "id">): Promise<User> {
    throw new Error("Not implemented");
  }

  static async update(id: number, data: Partial<Omit<User, "id">>): Promise<User | null> {
    throw new Error("Not implemented");
  }

  static async delete(id: number): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
