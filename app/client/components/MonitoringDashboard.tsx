import { HostMonitor } from "./HostMonitor";
import { useHostMonitoring } from "@/hooks/useHostMonitoring";
import { useStatusNotifications } from "@/hooks/useStatusNotifications";
import {
  RefreshCw,
  Activity,
  AlertCircle,
  Sun,
  Moon,
  Settings,
  Building2,
  Network,
  Users,
  LogOut,
  Edit3,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagement } from "./UserManagement";
import { DeviceStatusChart } from "./DeviceStatusChart";
import { useState, useMemo, useEffect } from "react";
import { Host } from "@shared/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface MonitoringDashboardProps {
  onOpenConfigurations: () => void;
}

export function MonitoringDashboard({
  onOpenConfigurations,
}: MonitoringDashboardProps) {
  const { hosts, loading, error, lastUpdated, refetch } = useHostMonitoring();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();

  // Sistema de notificações para mudanças de status
  const { resetNotifications } = useStatusNotifications({
    hosts,
    enabled: !loading && !error
  });

  // Resetar notificações quando API externa falha
  useEffect(() => {
    if (error && error.includes('API de monitoramento temporariamente indisponível')) {
      console.log('API externa indisponível - resetando notificações');
      resetNotifications();
    }
  }, [error, resetNotifications]);
  const [categoryFilter, setCategoryFilter] = useState<"Empresas" | "Pessoal">("Empresas");
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableHosts, setEditableHosts] = useState(hosts);
  const [showStatusChart, setShowStatusChart] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Host | null>(null);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar hosts por categoria
  const filteredHosts = useMemo(() => {
    const hostsToFilter = isEditMode ? editableHosts : hosts;
    return hostsToFilter
      .filter((host) => host.category === categoryFilter)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [hosts, editableHosts, categoryFilter, isEditMode]);

  // Atualizar editableHosts quando hosts mudar
  useMemo(() => {
    if (!isEditMode) {
      setEditableHosts(hosts);
    }
  }, [hosts, isEditMode]);

  // Função para lidar com o fim do arrastar
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setEditableHosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Atualizar a ordem dos itens
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  // Função para salvar a nova ordem
  const saveOrder = async () => {
    try {
      const filteredForSave = filteredHosts.filter(host => host.id); // Garantir que tem ID

      if (filteredForSave.length === 0) {
        console.warn('Nenhum dispositivo para salvar');
        setIsEditMode(false);
        return;
      }

      const deviceOrders = filteredForSave.map((host, index) => ({
        id: host.id,
        order: index + 1,
      }));

      console.log('Salvando ordem:', deviceOrders);

      const response = await fetch('/api/devices-config/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceOrders }),
      });

      if (response.ok) {
        console.log('Ordem salva com sucesso');
        setIsEditMode(false);
        refetch(); // Recarregar dados
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta da API:', errorData);
        alert(`Erro ao salvar ordem: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      alert(`Erro ao salvar ordem: ${error.message || 'Erro de conexão'}`);
    }
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditableHosts(hosts);
  };

  // Função para abrir gráfico de status
  const handleDeviceDoubleClick = (host: Host) => {
    if (!isEditMode) {
      setSelectedDevice(host);
      setShowStatusChart(true);
    }
  };

  const onlineHosts = filteredHosts.filter((host) => host.status === "online").length;
  const offlineHosts = filteredHosts.filter((host) => host.status === "offline").length;
  const warningHosts = filteredHosts.filter((host) => host.status === "warning").length;
  const disabledHosts = filteredHosts.filter((host) => host.status === "disabled").length;

  if (loading && hosts.length === 0) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-gray-50 to-gray-100"
        }`}
      >
        <div className="text-center">
          <RefreshCw
            className={`h-8 w-8 animate-spin mx-auto mb-4 ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
            Carregando dados de monitoramento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-10">
          {/* Main Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col justify-start items-start w-full">
              <div className="flex items-center w-full">
                {/* Logo */}
                <img
                  loading="lazy"
                  src={
                    theme === "dark"
                      ? "/images/triadefibra-branco.png"
                      : "/images/triadefibra-vermelho.png"
                  }
                  alt="TriadeFibra Logo"
                  className="w-32 h-auto mr-4 object-cover"
                  onError={(e) => {
                    // Fallback para logo do Builder.io se imagens não existirem
                    (e.target as HTMLImageElement).src =
                      "https://cdn.builder.io/api/v1/image/assets%2Fab9a4ee27f5c4cb1b2fea58921a402ed%2Fd39a41c371bf4a0a80683d73faa217b8";
                  }}
                />
                {/* Status Summary à esquerda da linha, após a logo */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Visão geral:
                    </span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {onlineHosts} Online
                  </Badge>
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    {offlineHosts} Offline
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    {warningHosts} Warning
                  </Badge>
                  {disabledHosts > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600"
                    >
                      {disabledHosts} Desativados
                    </Badge>
                  )}
                </div>
                {/* Botões à direita */}
                <div className="flex gap-2 ml-auto">
                  {/* Filtros de categoria - modernizados */}
                  <div className="flex gap-3 mr-6">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("Empresas")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                        categoryFilter === "Empresas"
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105"
                          : theme === "dark"
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400"
                      }`}
                      title="Mostrar apenas Empresas"
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm">Empresas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("Pessoal")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                        categoryFilter === "Pessoal"
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105"
                          : theme === "dark"
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400"
                      }`}
                      title="Mostrar apenas Pessoal"
                    >
                      <Network className="h-5 w-5" />
                      <span className="text-sm">Pessoal</span>
                    </button>
                  </div>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    className={`${
                      theme === "dark"
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Botão de Edição de Layout - apenas para admins */}
                  {isAdmin && (
                    <Button
                      onClick={isEditMode ? saveOrder : () => setIsEditMode(true)}
                      variant="outline"
                      size="sm"
                      className={`${
                        isEditMode
                          ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                          : theme === "dark"
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                      title={isEditMode ? "Salvar Layout" : "Editar Layout"}
                    >
                      {isEditMode ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                  )}

                  {/* Botão de Cancelar Edição - apenas quando em modo de edição */}
                  {isAdmin && isEditMode && (
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      size="sm"
                      className={`${
                        theme === "dark"
                          ? "border-red-600 text-red-300 hover:bg-red-700"
                          : "border-red-300 text-red-700 hover:bg-red-100"
                      }`}
                      title="Cancelar Edição"
                    >
                      ✕
                    </Button>
                  )}

                  {/* Botão de Configurações - apenas para admins */}
                  {isAdmin && (
                    <Button
                      onClick={onOpenConfigurations}
                      variant="outline"
                      size="sm"
                      className={`${
                        theme === "dark"
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                      title="Configurações de Hosts"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Botão de Usuários - apenas para admins */}
                  {isAdmin && (
                    <Button
                      onClick={() => setShowUserManagement(true)}
                      variant="outline"
                      size="sm"
                      className={`${
                        theme === "dark"
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                      title="Gerenciar Usuários"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Botão de Logout */}
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className={`${
                      theme === "dark"
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Sair do Sistema"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de Modo de Edição */}
        {isEditMode && (
          <Alert className={`mb-4 ${
            theme === "dark"
              ? "border-blue-600 bg-blue-900/20"
              : "border-blue-300 bg-blue-50"
          }`}>
            <Edit3 className={`h-4 w-4 ${
              theme === "dark" ? "text-blue-400" : "text-blue-600"
            }`} />
            <AlertDescription className={theme === "dark" ? "text-blue-300" : "text-blue-700"}>
              <strong>Modo de Edição Ativado:</strong> Arraste e solte os dispositivos para reorganizar o layout.
              Clique em "Salvar" para confirmar as mudanças ou "✕" para cancelar.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            className={`mb-4 ${
              theme === "dark"
                ? "border-red-600 bg-red-900/20"
                : "border-red-300 bg-red-50"
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            />
            <AlertDescription
              className={theme === "dark" ? "text-red-300" : "text-red-700"}
            >
              Erro ao carregar dados: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Host Grid */}
        {isEditMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredHosts.map(h => h.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-20 gap-1">
                {filteredHosts.map((host) => (
                  <HostMonitor
                    key={host.id}
                    host={host}
                    theme={theme}
                    isDraggable={true}
                    onDoubleClick={handleDeviceDoubleClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-20 gap-1">
            {filteredHosts.map((host) => (
              <HostMonitor
                key={host.id}
                host={host}
                theme={theme}
                onDoubleClick={handleDeviceDoubleClick}
              />
            ))}
          </div>
        )}

        {filteredHosts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Activity
              className={`h-16 w-16 mx-auto mb-4 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <h3
              className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}
            >
              Nenhum host configurado
            </h3>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Adicione hosts à sua configuração de monitoramento.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Gerenciamento de Usuários */}
      <UserManagement
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
      />

      {/* Modal de Gráfico de Status */}
      <DeviceStatusChart
        open={showStatusChart}
        onOpenChange={setShowStatusChart}
        device={selectedDevice}
      />
    </div>
  );
}
