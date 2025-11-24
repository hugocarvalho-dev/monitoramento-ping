import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from "@/contexts/ThemeContext";
import { Host } from "@shared/api";
import { RefreshCw, Clock } from "lucide-react";

interface DeviceStatusChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Host | null;
}

interface StatusLog {
  _id: string;
  ip: string;
  name: string;
  status: "online" | "offline" | "warning";
  datetime: string;
  timestamp: string; // For frontend compatibility
  response_time?: number;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  status: number; // 1 = online, 0.5 = warning, 0 = offline
  responseTime?: number;
}

const timeRanges = [
  { value: '30m', label: '30 minutos' },
  { value: '1hr', label: '1 hora' },
  { value: '3hr', label: '3 horas' },
];

export function DeviceStatusChart({ open, onOpenChange, device }: DeviceStatusChartProps) {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30m');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatusLogs = useCallback(async () => {
    if (!device) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Buscando histórico para dispositivo: ${device.name} (${device.ip})`);

      // Converter timeRange para minutos
      let minutes = 30; // default
      switch (timeRange) {
        case '30m':
          minutes = 30;
          break;
        case '1hr':
          minutes = 60;
          break;
        case '3hr':
          minutes = 180;
          break;
        default:
          minutes = 30;
      }

      console.log(`Buscando histórico de ${minutes} minutos para IP ${device.ip}`);

      const response = await fetch(`/api/proxy-status-history?ip=${device.ip}&minutes=${minutes}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`Recebidos ${data.length || 0} pontos do histórico:`, data);

      // Os dados já vêm no formato correto da API externa
      // [{"time":"10:53","status":"online"},{"time":"10:54","status":"online"}]
      const formattedLogs = data.map((item: any, index: number) => {
        // Criar timestamp completo baseado no time
        const today = new Date();
        const [hours, minutes] = item.time.split(':');
        const fullDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));

        return {
          _id: `${device.ip}-${index}`,
          ip: device.ip,
          name: device.name,
          status: item.status,
          timestamp: fullDate.toISOString(),
          datetime: fullDate.toISOString(),
          response_time: item.responseTime,
        };
      });

      setLogs(formattedLogs);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [device, timeRange]);

  // Buscar dados quando abrir o modal ou mudar configurações
  useEffect(() => {
    if (open && device) {
      fetchStatusLogs();
    }
  }, [open, device, timeRange, fetchStatusLogs]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!open || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatusLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [open, autoRefresh, fetchStatusLogs]);

  // Preparar dados para o gráfico
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!logs || logs.length === 0) {
      console.log('Nenhum dado de histórico disponível');
      return [];
    }

    console.log('Preparando dados do gráfico com', logs.length, 'pontos do histórico');

    // Converter diretamente os dados da API externa para o formato do gráfico
    const data: ChartDataPoint[] = logs.map((log) => {
      const statusValue = log.status === 'online' ? 1 : log.status === 'warning' ? 0.5 : 0;

      return {
        time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        timestamp: log.timestamp ? new Date(log.timestamp).getTime() : Date.now(),
        status: statusValue,
        responseTime: log.response_time,
      };
    });

    console.log(`Dados do gráfico preparados: ${data.length} pontos`);
    return data;
  }, [logs, timeRange]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'status') {
      if (value === 1) return ['Online', 'Status'];
      if (value === 0.5) return ['Warning', 'Status'];
      if (value === 0) return ['Offline', 'Status'];
    }
    if (name === 'responseTime') {
      return [`${value}ms`, 'Tempo de Resposta'];
    }
    return [value, name];
  };

  const getStatusColor = (status: number) => {
    if (status === 1) return '#10b981'; // green
    if (status === 0.5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-4xl w-full h-[600px] ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
            Status do Dispositivo: {device?.name}
          </DialogTitle>
          <DialogDescription className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
            {device?.ip} - Monitoramento em tempo real
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range.value)}
                  className={
                    timeRange === range.value
                      ? "bg-blue-600 text-white"
                      : theme === "dark"
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {range.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={
                  autoRefresh
                    ? "bg-green-600 text-white border-green-600"
                    : theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatusLogs}
                disabled={loading}
                className={`${
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Gráfico */}
          <div className="flex-1 min-h-0">
            {error ? (
              <div className={`flex items-center justify-center h-full text-center ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}>
                <div>
                  <p className="text-lg font-medium mb-2">Erro ao carregar dados</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className={`flex items-center justify-center h-full ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}>
                <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                Carregando dados...
              </div>
            ) : chartData.length === 0 ? (
              <div className={`flex items-center justify-center h-full text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                <div>
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
                  <p className="text-sm">Não há logs de status para o período selecionado</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="time"
                    stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(value) => {
                      if (value === 1) return 'Online';
                      if (value === 0.5) return 'Warning';
                      if (value === 0) return 'Offline';
                      return '';
                    }}
                    stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={formatTooltip}
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                      border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "6px",
                      color: theme === "dark" ? "#f9fafb" : "#111827"
                    }}
                  />
                  <Legend />
                  <Line
                    type="stepAfter"
                    dataKey="status"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Status"
                    dot={false}
                    connectNulls={false}
                  />
                  {chartData.some(d => d.responseTime !== undefined) && (
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      name="Tempo de Resposta (ms)"
                      yAxisId="right"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Estatísticas */}
          {chartData.length > 0 && (
            <div className={`grid grid-cols-4 gap-4 p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}>
              <div className="text-center">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Total de Eventos
                </p>
                <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {chartData.length}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Online
                </p>
                <p className="text-lg font-bold text-green-500">
                  {chartData.filter(d => d.status === 1).length}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Warning
                </p>
                <p className="text-lg font-bold text-yellow-500">
                  {chartData.filter(d => d.status === 0.5).length}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Offline
                </p>
                <p className="text-lg font-bold text-red-500">
                  {chartData.filter(d => d.status === 0).length}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
