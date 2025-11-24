import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string;
  login: string;
  password: string;
  role: "admin" | "user";
  name: string;
  isMaster?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem("authenticated_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (login: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        localStorage.setItem(
          "authenticated_user",
          JSON.stringify(userData.user),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authenticated_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
