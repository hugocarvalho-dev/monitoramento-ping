import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface User {
  id: string;
  login: string;
  role: "admin" | "user";
}

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManagement({ open, onOpenChange }: UserManagementProps) {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    login: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [editUser, setEditUser] = useState({
    password: "",
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users");

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsers([]); // Garantir que users sempre seja um array
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setNewUser({ login: "", password: "", role: "user" });
        setShowAddDialog(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar usuário");
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      alert("Erro ao criar usuário");
    }
  };

  const handleEditUser = async () => {
    if (!userToEdit) return;

    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editUser.password,
        }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        setUserToEdit(null);
        setEditUser({ password: "" });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao editar usuário");
      }
    } catch (error) {
      console.error("Erro ao editar usuário:", error);
      alert("Erro ao editar usuário");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const userToDeleteId = userToDelete.id;

    try {
      const response = await fetch(`/api/users/${userToDeleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao deletar usuário");
        setShowDeleteDialog(false);
        setUserToDelete(null);
        return;
      }

      // Fechar diálogo primeiro
      setShowDeleteDialog(false);
      setUserToDelete(null);

      // Recarregar dados
      await fetchUsers();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditUser({ password: "" });
    setShowEditDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`max-w-4xl ${theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
            }`}
        >
          <DialogHeader>
            <DialogTitle
              className={theme === "dark" ? "text-white" : "text-gray-900"}
            >
              Gerenciamento de Usuários
            </DialogTitle>
            <DialogDescription
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            >
              Gerencie os usuários do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>

            {loading ? (
              <p
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                Carregando...
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }
                      >
                        Login
                      </TableHead>
                      <TableHead
                        className={
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }
                      >
                        Função
                      </TableHead>
                      <TableHead
                        className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell
                          className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                        >
                          {user.login}
                        </TableCell>
                        <TableCell
                          className={
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }
                        >
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                            }`}>
                            {user.role === "admin" ? "Admin" : "Usuário"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                              className={`h-8 px-3 rounded-md transition-all ${theme === "dark"
                                  ? "border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                                  : "border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white"
                                }`}
                              title="Editar senha"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(user)}
                              className="h-8 px-3 rounded-md transition-all border-red-500 text-red-600 hover:bg-red-600 hover:text-white"
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar usuário */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setNewUser({ login: "", password: "", role: "user" });
        }
      }}>
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
              Adicionar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                Login
              </Label>
              <Input
                value={newUser.login}
                onChange={(e) =>
                  setNewUser({ ...newUser, login: e.target.value })
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
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                Senha
              </Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
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
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                Função
              </Label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: e.target.value as "admin" | "user",
                  })
                }
                className={`w-full rounded border px-3 py-2 mt-1 ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                  }`}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!newUser.login || !newUser.password}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar usuário */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setUserToEdit(null);
          setEditUser({ password: "" });
        }
      }}>
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
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                Login (não editável)
              </Label>
              <Input
                value={userToEdit?.login || ""}
                disabled
                className={
                  theme === "dark"
                    ? "bg-gray-600 border-gray-600 text-gray-400"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }
              />
            </div>
            <div>
              <Label
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                Nova Senha
              </Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) =>
                  setEditUser({ ...editUser, password: e.target.value })
                }
                placeholder="Digite a nova senha"
                className={
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={!editUser.password}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          console.log('Delete dialog state change:', open);
          if (!open) {
            // Limpar estados quando fechar
            setUserToDelete(null);
          }
          setShowDeleteDialog(open);
        }}
      >
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
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            >
              Tem certeza que deseja excluir o usuário "{userToDelete?.login}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className={
                theme === "dark"
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                console.log('Delete button clicked');
                handleDeleteUser();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
