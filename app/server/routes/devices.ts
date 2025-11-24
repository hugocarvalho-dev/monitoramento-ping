import { RequestHandler } from "express";
import { database } from "../database";
import { generateDeviceId } from "../utils/auth";

interface Device {
  _id?: string;
  id: string;
  name: string;
  ip: string;
  category: "Empresas" | "Teste";
  active?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiHost {
  id: string;
  name: string;
  ip: string;
  category: "Empresas" | "Teste";
  status: "online" | "offline" | "warning" | "disabled";
  uptime: number;
  lastSeen: string;
  responseTime?: number;
  active?: boolean;
  order?: number;
}

// GET /api/devices-config - Listar dispositivos da configuração
export const handleGetDevicesConfig: RequestHandler = async (req, res) => {
  try {
    const devicesCollection = database.getDevicesCollection();
    const devices = await devicesCollection
      .find({}, { projection: { _id: 0 } })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    res.json({ devices });
  } catch (error) {
    console.error("Erro ao buscar dispositivos:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// POST /api/devices-config - Adicionar dispositivo
export const handleCreateDevice: RequestHandler = async (req, res) => {
  try {
    const { name, ip, category, active = true } = req.body;

    if (!name || !ip || !category) {
      return res.status(400).json({ error: "Nome, IP e categoria são obrigatórios" });
    }

    const devicesCollection = database.getDevicesCollection();

    // Verificar se IP já existe
    const existingDevice = await devicesCollection.findOne({ ip });
    if (existingDevice) {
      return res.status(400).json({ error: "Já existe um dispositivo com este IP" });
    }

    // Verificar se nome já existe
    const existingName = await devicesCollection.findOne({ name });
    if (existingName) {
      return res.status(400).json({ error: "Já existe um dispositivo com este nome" });
    }

    // Obter próximo número de ordem
    const lastDevice = await devicesCollection
      .findOne({}, { sort: { order: -1 } });
    const nextOrder = (lastDevice?.order || 0) + 1;

    const newDevice: Device = {
      id: generateDeviceId(),
      name,
      ip,
      category,
      active,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await devicesCollection.insertOne(newDevice);

    const { _id, ...deviceWithoutId } = newDevice;
    res.json({ success: true, device: deviceWithoutId });
  } catch (error) {
    console.error("Erro ao criar dispositivo:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// PUT /api/devices-config/:id - Editar dispositivo
export const handleUpdateDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ip, category, active = true } = req.body;

    if (!name || !ip || !category) {
      return res.status(400).json({ error: "Nome, IP e categoria são obrigatórios" });
    }

    const devicesCollection = database.getDevicesCollection();

    // Verificar se IP já existe em outro dispositivo
    const existingDevice = await devicesCollection.findOne({
      ip,
      id: { $ne: id }
    });
    if (existingDevice) {
      return res.status(400).json({ error: "Já existe outro dispositivo com este IP" });
    }

    // Verificar se nome já existe em outro dispositivo
    const existingName = await devicesCollection.findOne({
      name,
      id: { $ne: id }
    });
    if (existingName) {
      return res.status(400).json({ error: "Já existe outro dispositivo com este nome" });
    }

    const result = await devicesCollection.updateOne(
      { id },
      {
        $set: {
          name,
          ip,
          category,
          active,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    const updatedDevice = await devicesCollection.findOne(
      { id },
      { projection: { _id: 0 } }
    );

    res.json({ success: true, device: updatedDevice });
  } catch (error) {
    console.error("Erro ao atualizar dispositivo:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// DELETE /api/devices-config/:id - Deletar dispositivo
export const handleDeleteDevice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const devicesCollection = database.getDevicesCollection();

    const result = await devicesCollection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar dispositivo:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// PUT /api/devices-config/reorder - Reordenar dispositivos (para drag & drop)
export const handleReorderDevices: RequestHandler = async (req, res) => {
  try {
    const { deviceOrders } = req.body;

    if (!Array.isArray(deviceOrders)) {
      return res.status(400).json({ error: "deviceOrders deve ser um array" });
    }

    console.log('Recebendo deviceOrders:', deviceOrders);

    const devicesCollection = database.getDevicesCollection();

    // Atualizar ordem de cada dispositivo
    const updatePromises = deviceOrders.map((item: { id: string; order: number }) => {
      console.log(`Atualizando device ${item.id} para ordem ${item.order}`);
      return devicesCollection.updateOne(
        { id: item.id },
        {
          $set: {
            order: item.order,
            updatedAt: new Date()
          }
        }
      );
    });

    const results = await Promise.all(updatePromises);
    console.log('Resultados das atualizações:', results.map(r => ({ matchedCount: r.matchedCount, modifiedCount: r.modifiedCount })));

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao reordenar dispositivos:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// GET /api/hosts - Buscar status dos hosts da API externa + configurações do MongoDB
export const handleGetHosts: RequestHandler = async (req, res) => {
  try {
    // Buscar configurações dos dispositivos no MongoDB
    const devicesCollection = database.getDevicesCollection();
    const devices = await devicesCollection
      .find({}, { projection: { _id: 0 } })
      .sort({ order: 1, createdAt: 1 })
      .toArray() as Device[];

    if (devices.length === 0) {
      return res.status(500).json({ error: "Nenhum dispositivo configurado" });
    }

    let hostsWithStatus: ApiHost[] = [];

    try {
      // Tentar buscar status da API externa
      const response = await fetch("http://localhost:8000/api/hosts", {
        timeout: 5000 // 5 segundos de timeout
      });

      if (response.ok) {
        const apiData = await response.json();

        // Combinar dados da API com configurações do MongoDB
        hostsWithStatus = devices.map((device) => {
          // Se device está desativado, não consultar API externa
          if (device.active === false) {
            return {
              id: device.id,
              name: device.name,
              ip: device.ip,
              category: device.category,
              order: device.order || 0,
              status: "disabled" as const,
              uptime: 0,
              lastSeen: new Date().toISOString(),
              responseTime: undefined,
              active: device.active,
            };
          }

          const apiHost = apiData.hosts?.find((h: any) => h.ip === device.ip);

          // Determinar status baseado no ping e status original
          let finalStatus = apiHost?.status || "offline";
          if (finalStatus === "online" && apiHost?.responseTime && apiHost.responseTime > 80) {
            finalStatus = "warning";
          }

          return {
            id: device.id,
            name: device.name,
            ip: device.ip,
            category: device.category,
            order: device.order || 0,
            status: finalStatus,
            uptime: apiHost?.uptime || 0,
            lastSeen: apiHost?.lastSeen || new Date().toISOString(),
            responseTime: apiHost?.responseTime,
            active: device.active,
          };
        });
      } else {
        throw new Error(`API externa retornou ${response.status}`);
      }
    } catch (apiError) {
      console.warn("API externa inacessível, usando dados offline:", apiError.message);

      // Se a API externa falhar, retornar dispositivos com status offline (ou disabled)
      hostsWithStatus = devices.map((device) => ({
        id: device.id,
        name: device.name,
        ip: device.ip,
        category: device.category,
        order: device.order || 0,
        status: device.active === false ? "disabled" as const : "offline" as const,
        uptime: 0,
        lastSeen: new Date().toISOString(),
        responseTime: undefined,
        active: device.active,
      }));
    }

    res.json({
      hosts: hostsWithStatus,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao buscar hosts:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};

// GET /api/proxy-status-history - Proxy para API externa de histórico
export const handleProxyStatusHistory: RequestHandler = async (req, res) => {
  try {
    const { ip, minutes } = req.query;

    if (!ip || !minutes) {
      return res.status(400).json({ error: "IP e minutes são obrigatórios" });
    }

    const url = `http://localhost:8000/status-history?ip=${ip}&minutes=${minutes}`;
    console.log(`Proxy fazendo requisição para: ${url}`);

    const response = await fetch(url, {
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      throw new Error(`API externa retornou ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro no proxy status-history:", error);
    res.status(500).json({ error: "Erro ao acessar API externa de histórico" });
  }
};

// GET /api/device-status/:deviceId - Buscar logs de status de um dispositivo específico
export const handleGetDeviceStatus: RequestHandler = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '15m' } = req.query;

    // Primeiro, buscar o dispositivo para obter o IP
    const devicesCollection = database.getDevicesCollection();
    const device = await devicesCollection.findOne({ id: deviceId });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    // Calcular timestamp baseado no range
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '30m':
        startTime = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case '1hr':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      default: // 15m
        startTime = new Date(now.getTime() - 15 * 60 * 1000);
    }

    const statusLogsCollection = database.getStatusLogsCollection();

    // Buscar logs usando IP e datetime (conforme estrutura real)
    const logs = await statusLogsCollection
      .find({
        ip: device.ip,
        datetime: { $gte: startTime }
      })
      .sort({ datetime: 1 })
      .toArray();

    // Transformar dados para o formato esperado pelo frontend
    const transformedLogs = logs.map(log => ({
      _id: log._id,
      device_id: deviceId,
      status: log.status,
      timestamp: log.datetime,
      ip: log.ip,
      name: log.name
    }));

    // Se não há logs no período, buscar o último status conhecido
    if (transformedLogs.length === 0) {
      const lastLog = await statusLogsCollection
        .findOne(
          { ip: device.ip },
          { sort: { datetime: -1 } }
        );

      if (lastLog) {
        // Criar ponto atual baseado no último status
        transformedLogs.push({
          _id: lastLog._id,
          device_id: deviceId,
          status: lastLog.status,
          timestamp: now.toISOString(),
          ip: lastLog.ip,
          name: lastLog.name
        });
      }
    }

    console.log(`Encontrados ${transformedLogs.length} logs para dispositivo ${device.name} (${device.ip})`);
    res.json({ logs: transformedLogs });
  } catch (error) {
    console.error("Erro ao buscar logs de status:", error);
    res.status(500).json({ error: "Banco de dados inacessível" });
  }
};
