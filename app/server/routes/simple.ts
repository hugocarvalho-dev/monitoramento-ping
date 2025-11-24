import { RequestHandler } from "express";
import { simpleDB } from "../simpleDatabase";
import { hashPassword, comparePassword, generateUserId, generateDeviceId } from "../utils/auth";

// AUTH ROUTES
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: "Login e senha são obrigatórios" });
    }

    const user = simpleDB.getUserByLogin(login);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const users = simpleDB.getUsers(true); // Excluir master
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPassword });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { login, password, name, role } = req.body;

    if (!login || !password || !name || !role) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se login já existe
    const existingUser = simpleDB.getUserByLogin(login);
    if (existingUser) {
      return res.status(400).json({ error: "Login já existe" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: generateUserId(),
      login,
      password: hashedPassword,
      name,
      role,
    };

    simpleDB.addUser(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleUpdateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Nome e senha são obrigatórios" });
    }

    const user = simpleDB.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.isMaster) {
      return res.status(403).json({ error: "Não é possível editar o usuário master" });
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = simpleDB.updateUser(id, {
      name,
      password: hashedPassword,
    });

    if (updatedUser) {
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const user = simpleDB.getUserById(id);
    if (user?.isMaster) {
      return res.status(403).json({ error: "Não é possível deletar o usuário master" });
    }

    const deleted = simpleDB.deleteUser(id);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// DEVICE ROUTES
export const handleGetDevicesConfig: RequestHandler = async (req, res) => {
  try {
    const devices = simpleDB.getDevices();
    res.json({ devices });
  } catch (error) {
    console.error("Erro ao buscar dispositivos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleCreateDevice: RequestHandler = async (req, res) => {
  try {
    const { name, ip, category } = req.body;

    if (!name || !ip || !category) {
      return res.status(400).json({ error: "Nome, IP e categoria são obrigatórios" });
    }

    // Verificar se IP já existe
    const devices = simpleDB.getDevices();
    if (devices.some(d => d.ip === ip)) {
      return res.status(400).json({ error: "Já existe um dispositivo com este IP" });
    }

    // Verificar se nome já existe
    if (devices.some(d => d.name === name)) {
      return res.status(400).json({ error: "Já existe um dispositivo com este nome" });
    }

    const maxOrder = Math.max(...devices.map(d => d.order), 0);
    const newDevice = {
      id: generateDeviceId(),
      name,
      ip,
      category,
      order: maxOrder + 1,
    };

    simpleDB.addDevice(newDevice);
    res.json({ success: true, device: newDevice });
  } catch (error) {
    console.error("Erro ao criar dispositivo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleUpdateDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ip, category } = req.body;

    if (!name || !ip || !category) {
      return res.status(400).json({ error: "Nome, IP e categoria são obrigatórios" });
    }

    const devices = simpleDB.getDevices();

    // Verificar se IP já existe em outro dispositivo
    if (devices.some(d => d.ip === ip && d.id !== id)) {
      return res.status(400).json({ error: "Já existe outro dispositivo com este IP" });
    }

    // Verificar se nome já existe em outro dispositivo
    if (devices.some(d => d.name === name && d.id !== id)) {
      return res.status(400).json({ error: "Já existe outro dispositivo com este nome" });
    }

    const updatedDevice = simpleDB.updateDevice(id, { name, ip, category });

    if (updatedDevice) {
      res.json({ success: true, device: updatedDevice });
    } else {
      res.status(404).json({ error: "Dispositivo não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao atualizar dispositivo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleDeleteDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = simpleDB.deleteDevice(id);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Dispositivo não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao deletar dispositivo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const handleReorderDevices: RequestHandler = async (req, res) => {
  try {
    const { deviceOrders } = req.body;

    if (!Array.isArray(deviceOrders)) {
      return res.status(400).json({ error: "deviceOrders deve ser um array" });
    }

    simpleDB.reorderDevices(deviceOrders);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao reordenar dispositivos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// HOSTS ROUTE (combina API externa + dados locais)
export const handleGetHosts: RequestHandler = async (req, res) => {
  try {
    const devices = simpleDB.getDevices();
    let hostsWithStatus: any[] = [];

    try {
      // Tentar buscar status da API externa
      const response = await fetch("http://localhost:8000/api/hosts");
      if (response.ok) {
        const apiData = await response.json();

        // Combinar dados da API com configurações locais
        hostsWithStatus = devices.map((device) => {
          const apiHost = apiData.hosts?.find((h: any) => h.ip === device.ip);

          return {
            id: device.id,
            name: device.name,
            ip: device.ip,
            category: device.category,
            order: device.order,
            status: apiHost?.status || "offline",
            uptime: apiHost?.uptime || 0,
            lastSeen: apiHost?.lastSeen || new Date().toISOString(),
            responseTime: apiHost?.responseTime,
          };
        });
      } else {
        throw new Error("API externa não disponível");
      }
    } catch (apiError) {
      console.warn("API externa não disponível, usando dados padrão");

      // Se a API externa falhar, usar dados padrão
      hostsWithStatus = devices.map((device) => ({
        id: device.id,
        name: device.name,
        ip: device.ip,
        category: device.category,
        order: device.order,
        status: "offline" as const,
        uptime: 0,
        lastSeen: new Date().toISOString(),
        responseTime: undefined,
      }));
    }

    res.json({
      hosts: hostsWithStatus,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao buscar hosts:", error);
    res.status(500).json({ error: "Falha ao carregar hosts" });
  }
};
