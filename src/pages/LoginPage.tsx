import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Estados para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const { signIn, signUp } = useAuth();

  const validateSignUpForm = (): boolean => {
    if (nationalId && nationalId.length !== 10) {
      setError("La cédula debe tener exactamente 10 dígitos.");
      return false;
    }
    if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const eightyYearsAgo = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
        
        if (birthDate > today) {
            setError("La fecha de nacimiento no puede ser en el futuro.");
            return false;
        }
        if (birthDate < eightyYearsAgo) {
            setError("La edad no puede ser superior a 80 años.");
            return false;
        }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!isLogin && !validateSignUpForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      } else {
        const userData = {
          email, password, full_name: fullName, role,
          date_of_birth: dateOfBirth || null,
          national_id: nationalId || null,
          phone_number: phoneNumber || null,
        };
        console.log('--- FRONTEND: Enviando datos de registro ---', userData);
        const { error: signUpError } = await signUp(userData);
        if (signUpError) throw signUpError;
        
        setMessage('¡Registro exitoso! Por favor, inicia sesión con tus nuevas credenciales.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: unknown) {
      const apiError = err as { message: string };
      console.error('--- FRONTEND: Error recibido del backend ---', err);
      setError(apiError.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {message && <Alert><AlertTitle>Éxito</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label htmlFor="role">Quiero registrarme como</label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')} className="w-full p-2 border rounded-md">
                    <option value="student">Estudiante</option>
                    <option value="teacher">Profesor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="fullName">Nombre Completo</label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nationalId">Cédula (10 dígitos)</label>
                  <Input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} maxLength={10} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth">Fecha de Nacimiento</label>
                  <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phoneNumber">Teléfono (10 dígitos)</label>
                  <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} disabled={loading} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="email">Correo Electrónico</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required minLength={6} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarme')}</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <Button variant="link" onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }} disabled={loading}>{isLogin ? 'Regístrate' : 'Inicia sesión'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;