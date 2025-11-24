import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  Search,
  Building2,
  Network,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface HostConfig {
  id: string;
  name: string;
  ip: string;
  category: "Empresas" | "Pessoal";
  active?: boolean;
}

interface ConfigurationsPageProps {
  onBack: () => void;
}

export function ConfigurationsPage({ onBack }: ConfigurationsPageProps) {
  const { theme } = useTheme();
  const [hosts, setHosts] = useState<HostConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingHost, setEditingHost] = useState<HostConfig | null>(null);
  const [deletingHost, setDeletingHost] = useState<HostConfig | null>(null);
  const [newHost, setNewHost] = useState<HostConfig>({
    id: "",
    name: "",
    ip: "",
    category: "Empresas",
    active: true,
  });
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"Empresas" | "Pessoal" | "">("");

  // Carregar configurações
  useEffect(() => {
    fetchHosts();
  }, []);

  // Filtrar hosts baseado no termo de busca e categoria
  const filteredHosts = useMemo(() => {
    return hosts.filter(
      (host) =>
        (host.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          host.ip.toLowerCase().includes(searchFilter.toLowerCase()) ||
          host.category.toLowerCase().includes(searchFilter.toLowerCase())) &&
        (categoryFilter === "" || host.category === categoryFilter)
    );
  }, [hosts, searchFilter, categoryFilter]);

  const fetchHosts = async () => {
    try {
      const response = await fetch("/api/devices-config");
      const data = await response.json();
      setHosts(data.devices || []);
    } catch (error) {
      console.error("Erro ao carregar dispositivos:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveHost = async (host: HostConfig) => {
    try {
      const response = await fetch(`/api/devices-config/${host.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: host.name,
          ip: host.ip,
          category: host.category,
          active: host.active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao salvar dispositivo");
        return;
      }

      fetchHosts();
      setEditDialog(false);
      setEditingHost(null);
    } catch (error) {
      console.error("Erro ao salvar dispositivo:", error);
      alert("Erro ao salvar dispositivo");
    }
  };

  const addHost = async () => {
    try {
      const response = await fetch("/api/devices-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHost.name,
          ip: newHost.ip,
          category: newHost.category,
          active: newHost.active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao adicionar dispositivo");
        return;
      }

      fetchHosts();
      setAddDialog(false);
      setNewHost({ id: "", name: "", ip: "", category: "Empresas", active: true });
    } catch (error) {
      console.error("Erro ao adicionar dispositivo:", error);
      alert("Erro ao adicionar dispositivo");
    }
  };

  const deleteHost = async () => {
    if (!deletingHost) return;

    try {
      const response = await fetch(`/api/devices-config/${deletingHost.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao deletar dispositivo");
        return;
      }

      fetchHosts();
      setDeleteDialog(false);
      setDeletingHost(null);
    } catch (error) {
      console.error("Erro ao deletar dispositivo:", error);
      alert("Erro ao deletar dispositivo");
    }
  };

  const openEditDialog = (host: HostConfig) => {
    setEditingHost({ ...host });
    setEditDialog(true);
  };

  const openDeleteDialog = (host: HostConfig) => {
    setDeletingHost(host);
    setDeleteDialog(true);
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className={`mr-4 ${
              theme === "dark"
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Configurações de Hosts
          </h1>
        </div>

        {/* Add Button and Search */}
        <div className="mb-6 flex gap-4 items-center">
          <Button
            onClick={() => setAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Host
          </Button>

          <div className="flex-1 max-w-md relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            />
            <Input
              placeholder="Buscar por nome ou IP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={`pl-10 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Filtros de categoria - modernizados */}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={() =>
                setCategoryFilter((prev) => (prev === "Empresas" ? "" : "Empresas"))
              }
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
              onClick={() =>
                setCategoryFilter((prev) => (prev === "Pessoal" ? "" : "Pessoal"))
              }
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
        </div>

        {/* Hosts Table */}
        <Card
          className={
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }
        >
          <CardHeader>
            <CardTitle
              className={theme === "dark" ? "text-white" : "text-gray-900"}
            >
              Lista de Hosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                Carregando...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        } w-2/5`}
                      >
                        Nome
                      </TableHead>
                      <TableHead
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        } w-1/4`}
                      >
                        IP
                      </TableHead>
                      <TableHead
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        } w-1/6`}
                      >
                        Categoria
                      </TableHead>
                      <TableHead
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        } w-1/8 text-center`}
                      >
                        Status
                      </TableHead>
                      <TableHead
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        } w-1/8 text-center`}
                      >
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHosts.map((host) => (
                      <TableRow
                        key={host.id}
                        className="hover:bg-opacity-50"
                        style={{ lineHeight: "1.1", height: "30px", paddingTop: 0, paddingBottom: 0 }} // reduz ainda mais o espaçamento
                      >
                        <TableCell
                          className={`${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          } font-medium !py-1`} // reduz padding vertical da célula
                        >
                          {host.name}
                        </TableCell>
                        <TableCell
                          className={`${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          } font-mono text-sm !py-1`} // reduz padding vertical da célula
                        >
                          {host.ip}
                        </TableCell>
                        <TableCell
                          className={`${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          } !py-1`}
                        >
                          {host.category}
                        </TableCell>
                        <TableCell className="!py-1 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            host.active !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {host.active !== false ? "Ativo" : "Desativado"}
                          </span>
                        </TableCell>
                        <TableCell className="!py-1">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(host)}
                              className={`h-8 w-8 p-0 ${
                                theme === "dark"
                                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(host)}
                              className="h-8 w-8 p-0 border-red-600 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent
            className={
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }
          >
            <DialogHeader>
              <DialogTitle
                className={theme === "dark" ? "text-white" : "text-gray-900"}
              >
                Editar Host
              </DialogTitle>
              <DialogDescription
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                Modifique as informações do host.
              </DialogDescription>
            </DialogHeader>
            {editingHost && (
              <div className="space-y-4">
                <div>
                  <Label
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    Nome
                  </Label>
                  <Input
                    value={editingHost.name}
                    onChange={(e) =>
                      setEditingHost({ ...editingHost, name: e.target.value })
                    }
                    className={
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }
                  />
                </div>
                <div>
                  <Label
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    IP
                  </Label>
                  <Input
                    value={editingHost.ip}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir apenas números e pontos
                      if (/^[0-9.]*$/.test(value)) {
                        setEditingHost({ ...editingHost, ip: value });
                      }
                    }}
                    placeholder="Ex: 192.168.1.100"
                    pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                    title="Digite um endereço IP válido (ex: 192.168.1.100)"
                    className={
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }
                  />
                </div>
                <div>
                  <Label
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    Categoria
                  </Label>
                  <select
                    value={editingHost.category}
                    onChange={(e) =>
                      setEditingHost({
                        ...editingHost,
                        category: e.target.value as "Empresas" | "Pessoal",
                      })
                    }
                    className={`w-full rounded border px-3 py-2 mt-1 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="Empresas">Empresas</option>
                    <option value="Pessoal">Pessoal</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editingHost.active !== false}
                    onChange={(e) =>
                      setEditingHost({
                        ...editingHost,
                        active: e.target.checked,
                      })
                    }
                    className={`rounded border ${
                      theme === "dark"
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <Label
                    htmlFor="edit-active"
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    Ativar dispositivo
                  </Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialog(false)}
                className={
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }
              >
                Cancelar
              </Button>
              <Button
                onClick={() => editingHost && saveHost(editingHost)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent
            className={
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }
          >
            <AlertDialogHeader>
              <AlertDialogTitle
                className={theme === "dark" ? "text-white" : "text-gray-900"}
              >
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                Tem certeza que deseja excluir o host "{deletingHost?.name}" (
                {deletingHost?.ip})? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className={
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteHost}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent
            className={
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }
          >
            <DialogHeader>
              <DialogTitle
                className={theme === "dark" ? "text-white" : "text-gray-900"}
              >
                Adicionar Host
              </DialogTitle>
              <DialogDescription
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                Adicione um novo host para monitoramento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label
                  className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }
                >
                  Nome
                </Label>
                <Input
                  value={newHost.name}
                  onChange={(e) =>
                    setNewHost({ ...newHost, name: e.target.value })
                  }
                  placeholder="Ex: SERVIDOR PRINCIPAL"
                  className={
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }
                />
              </div>
              <div>
                <Label
                  className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }
                >
                  IP
                </Label>
                <Input
                  value={newHost.ip}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir apenas números e pontos
                    if (/^[0-9.]*$/.test(value)) {
                      setNewHost({ ...newHost, ip: value });
                    }
                  }}
                  placeholder="Ex: 192.168.1.100"
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                  title="Digite um endereço IP válido (ex: 192.168.1.100)"
                  className={
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }
                />
              </div>
              <div>
                <Label
                  className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }
                >
                  Categoria
                </Label>
                <select
                  value={newHost.category}
                  onChange={(e) =>
                    setNewHost({
                      ...newHost,
                      category: e.target.value as "Empresas" | "Pessoal",
                    })
                  }
                  className={`w-full rounded border px-3 py-2 mt-1 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="Empresas">Empresas</option>
                  <option value="Pessoal">Pessoal</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-active"
                  checked={newHost.active !== false}
                  onChange={(e) =>
                    setNewHost({
                      ...newHost,
                      active: e.target.checked,
                    })
                  }
                  className={`rounded border ${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-white"
                  }`}
                />
                <Label
                  htmlFor="add-active"
                  className={
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }
                >
                  Ativar dispositivo
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddDialog(false)}
                className={
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }
              >
                Cancelar
              </Button>
              <Button
                onClick={addHost}
                disabled={!newHost.name || !newHost.ip}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
