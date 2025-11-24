import { RequestHandler } from "express";
import { database } from "../database";
import { hashPassword, comparePassword, generateUserId } from "../utils/auth";

interface User {
  _id?: string;
  id: string;
  login: string;
  password: string;
  role: "admin" | "user";
  isMaster?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// POST /api/auth/login
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: "Login e senha são obrigatórios" });
    }

    const usersCollection = database.getUsersCollection();
    const user = await usersCollection.findOne({ login }) as User;

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Não retornar senha na resposta
    const { password: _, _id, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// GET /api/users - Listar usuários (apenas para admins)
export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const usersCollection = database.getUsersCollection();
    const users = await usersCollection
      .find(
        { isMaster: { $ne: true } }, // Excluir usuário master
        { projection: { password: 0, _id: 0 } } // Não retornar senha
      )
      .toArray();

    res.json({ users });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// POST /api/users - Criar usuário (apenas para admins)
export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { login, password, role } = req.body;

    if (!login || !password || !role) {
      return res.status(400).json({ error: "Login, senha e função são obrigatórios" });
    }

    const usersCollection = database.getUsersCollection();

    // Verificar se login já existe
    const existingUser = await usersCollection.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ error: "Login já existe" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser: User = {
      id: generateUserId(),
      login,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    const { password: _, _id, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// PUT /api/users/:id - Editar usuário (apenas para admins)
export const handleUpdateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Senha é obrigatória" });
    }

    const usersCollection = database.getUsersCollection();
    const user = await usersCollection.findOne({ id }) as User;

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Não permitir editar usuário master
    if (user.isMaster) {
      return res.status(403).json({ error: "Não é possível editar o usuário master" });
    }

    const hashedPassword = await hashPassword(password);
    await usersCollection.updateOne(
      { id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await usersCollection.findOne(
      { id },
      { projection: { password: 0, _id: 0 } }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// DELETE /api/users/:id - Deletar usuário (apenas para admins)
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usersCollection = database.getUsersCollection();

    // Verificar se é usuário master
    const user = await usersCollection.findOne({ id }) as User;
    if (user?.isMaster) {
      return res.status(403).json({ error: "Não é possível deletar o usuário master" });
    }

    const result = await usersCollection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// Função para criar usuário master inicial
export async function createMasterUser() {
  try {
    const usersCollection = database.getUsersCollection();

    // Verificar se usuário master já existe
    const masterExists = await usersCollection.findOne({ isMaster: true });
    if (masterExists) {
      return;
    }

    const hashedPassword = await hashPassword("123");
    const masterUser: User = {
      id: "master",
      login: "admin",
      password: hashedPassword,
      role: "admin",
      isMaster: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(masterUser);
    console.log("✅ Usuário master criado");
  } catch (error) {
    console.error("Erro ao criar usuário master:", error);
  }
}
