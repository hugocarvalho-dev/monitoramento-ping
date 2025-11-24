import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:8001';
const DATABASE_NAME = 'monitoramento';

class Database {
  private client: MongoClient;
  private db: Db | null = null;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(DATABASE_NAME);
      console.log('✅ Conectado ao MongoDB');
    } catch (error) {
      console.error('❌ Erro ao conectar ao MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('MongoDB desconectado');
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database não está conectado');
    }
    return this.db;
  }

  getCollection(name: string): Collection {
    return this.getDb().collection(name);
  }

  // Collections específicas
  getUsersCollection(): Collection {
    return this.getCollection('users');
  }

  getDevicesCollection(): Collection {
    return this.getCollection('devices');
  }

  getStatusLogsCollection(): Collection {
    return this.getCollection('status_logs');
  }
}

export const database = new Database();

// Inicializar conexão
export async function initializeDatabase() {
  try {
    await database.connect();
    
    // Criar índices únicos
    await database.getUsersCollection().createIndex({ login: 1 }, { unique: true });
    await database.getDevicesCollection().createIndex({ ip: 1 }, { unique: true });
    await database.getStatusLogsCollection().createIndex({ device_id: 1, timestamp: -1 });
    
    console.log('✅ Database inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar database:', error);
    throw error;
  }
}
