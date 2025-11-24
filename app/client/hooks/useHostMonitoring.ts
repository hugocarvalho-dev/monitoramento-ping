import { useState, useEffect, useCallback } from "react";
import { Host } from "@shared/api";

export function useHostMonitoring(refreshInterval: number = 1000) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchHosts = useCallback(async () => {
    try {
      // Carregar status dos hosts
      const response = await fetch("/api/hosts");

      if (!response.ok) {
        // Se for erro 500, pode ser problema com API externa
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          console.warn('API externa pode estar inacessível:', errorData.error);
          setError("API de monitoramento temporariamente indisponível");
        } else {
          throw new Error(`Erro HTTP ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      // Garantir que temos um array de hosts
      if (!data.hosts || !Array.isArray(data.hosts)) {
        console.error('Resposta da API inválida:', data);
        setError("Dados de monitoramento inválidos");
        return;
      }

      // Garantir IDs únicos para evitar duplicatas
      const uniqueHosts = data.hosts.reduce((acc: any[], host: any) => {
        const existingIndex = acc.findIndex(
          (h) => h.id === host.id || h.ip === host.ip,
        );
        if (existingIndex === -1) {
          acc.push(host);
        } else {
          // Se já existe, atualizar com dados mais recentes
          acc[existingIndex] = host;
        }
        return acc;
      }, []);

      setHosts(uniqueHosts);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar hosts:', err);
      setError(err instanceof Error ? err.message : "Falha de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();

    const interval = setInterval(fetchHosts, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchHosts, refreshInterval]);

  return {
    hosts,
    loading,
    error,
    lastUpdated,
    refetch: fetchHosts,
  };
}
