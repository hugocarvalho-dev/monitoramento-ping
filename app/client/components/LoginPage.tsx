import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authenticate } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await authenticate(login, password);
      if (!success) {
        setError("Credenciais inválidas. Verifique seu login e senha.");
      }
    } catch (error) {
      setError("Erro ao tentar fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/triadefibra-branco.png"
            alt="TriadeFibra Logo"
            className="w-48 h-auto mx-auto object-cover"
            onError={(e) => {
              // Fallback para logo do Builder.io se imagem não existir
              (e.target as HTMLImageElement).src =
                "https://cdn.builder.io/api/v1/image/assets%2Fab9a4ee27f5c4cb1b2fea58921a402ed%2Fd39a41c371bf4a0a80683d73faa217b8";
            }}
          />
        </div>

        {/* Formulário de Login */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center text-xl">
              Acesso ao Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="login" className="text-gray-300">
                  Login
                </Label>
                <Input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Digite seu login"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Digite sua senha"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !login || !password}
              >
                {loading ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
