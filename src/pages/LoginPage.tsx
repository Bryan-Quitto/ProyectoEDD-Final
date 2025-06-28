import { useState } from 'react';
import { AuthService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("--- Formulario enviado ---");
    
    setError(null);
    setMessage(null);
    setLoading(true);
    console.log("1. Estado de 'loading' establecido en: true");

    try {
      if (isLogin) {
        console.log("2. Llamando a AuthService.signIn con:", email);
        const response = await AuthService.signIn(email, password);
        console.log("3. Respuesta recibida de AuthService:", response);
        
        if (!response.success) {
          console.error("4. Error en la respuesta del servicio:", response.error);
          throw new Error(response.error || 'Error al iniciar sesión.');
        }
        
        console.log("5. Inicio de sesión exitoso, esperando a AuthProvider...");
      } else {
        // Lógica de registro...
        if (!fullName) {
          throw new Error('El nombre completo es requerido para el registro.');
        }
        const response = await AuthService.signUp({ email, password, full_name: fullName, role: 'student' });
        if (!response.success) throw new Error(response.error || 'Error al registrarse.');
        setMessage(response.message || 'Registro exitoso. Revisa tu correo.');
      }
    } catch (err: any) {
      console.error("6. CATCH BLOCK: Se ha producido un error:", err.message);
      setError(err.message);
    } finally {
      console.log("7. FINALLY BLOCK: Estado de 'loading' establecido en: false");
      setLoading(false);
    }
  };

  // El resto del JSX se mantiene igual, te lo incluyo para que sea fácil copiar y pegar
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Ingresa tus credenciales para acceder a la plataforma.' : 'Completa el formulario para registrarte.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert variant="success">
                 <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {!isLogin && (
              <Input
                id="fullName"
                placeholder="Nombre Completo"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            )}
            <Input
              id="email"
              placeholder="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <Input
              id="password"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarme')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="font-semibold">
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}