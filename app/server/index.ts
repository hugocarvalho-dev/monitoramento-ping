import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database";
import {
  handleLogin,
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  createMasterUser,
} from "./routes/auth";
import {
  handleGetHosts,
  handleGetDevicesConfig,
  handleCreateDevice,
  handleUpdateDevice,
  handleDeleteDevice,
  handleReorderDevices,
  handleGetDeviceStatus,
  handleProxyStatusHistory,
} from "./routes/devices";

export async function createServer() {
  const app = express();

  try {
    // Inicializar MongoDB
    await initializeDatabase();
    await createMasterUser();
    console.log('✅ Servidor inicializado com MongoDB');
  } catch (error) {
    console.error('❌ Falha ao conectar com MongoDB:', error);
    throw error;
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });



  // Hosts routes (combinando API externa + MongoDB)
  app.get("/api/hosts", handleGetHosts);
  app.get("/api/proxy-status-history", handleProxyStatusHistory);

  // Device configuration routes (MongoDB)
  app.get("/api/devices-config", handleGetDevicesConfig);
  app.post("/api/devices-config", handleCreateDevice);
  app.put("/api/devices-config/reorder", handleReorderDevices); // DEVE VIR ANTES DE /:id
  app.put("/api/devices-config/:id", handleUpdateDevice);
  app.delete("/api/devices-config/:id", handleDeleteDevice);

  // Device status logs (MongoDB)
  app.get("/api/device-status/:deviceId", handleGetDeviceStatus);

  // Auth routes (MongoDB)
  app.post("/api/auth/login", handleLogin);
  app.get("/api/users", handleGetUsers);
  app.post("/api/users", handleCreateUser);
  app.put("/api/users/:id", handleUpdateUser);
  app.delete("/api/users/:id", handleDeleteUser);

  return app;
}
