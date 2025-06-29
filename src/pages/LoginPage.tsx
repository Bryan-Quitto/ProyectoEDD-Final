import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
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

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          throw signInError;
        }
      } else {
        if (!fullName) {
          throw new Error('El nombre completo es requerido para el registro.');
        }
        const { error: signUpError } = await signUp({ 
            email, 
            password, 
            full_name: fullName, 
            role: 'student' 
        });
        if (signUpError) {
          throw signUpError;
        }
        setMessage('¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta (si la confirmación está activada).');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <div className="space-y-2">
                <label htmlFor="fullName">Nombre Completo</label>
                <Input
                  id="fullName"
                  placeholder="Tu Nombre Apellido"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email">Correo Electrónico</label>
              <Input
                id="email"
                placeholder="tu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Contraseña</label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
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

export default LoginPage;