import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin'; // Importa el único cliente del backend

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role, date_of_birth, national_id, phone_number } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'student' }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Supabase no devolvió un usuario.");

    const userId = authData.user.id;
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        full_name, email, role: role || 'student',
        date_of_birth: date_of_birth || null,
        national_id: national_id || null,
        phone_number: phone_number || null
      }]);

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return res.status(201).json({ message: "Usuario creado exitosamente. Por favor, revisa tu correo para confirmar." });

  } catch (error: any) {
    console.error('--- ERROR EN /signup ---', error);
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return res.status(409).json({ message: 'Un usuario con este email ya existe.' });
    }
    return res.status(500).json({ message: error.message || 'Ocurrió un error en el servidor.' });
  }
});

router.post('/signin', async (req: Request, res: Response) => {
    // Para el signin, SÍ usamos el cliente del frontend, ya que es una operación del usuario
    // Esta lógica debe estar en el frontend, no en el backend.
    // Lo mantenemos aquí temporalmente, pero esto debería cambiar.
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ message: error.message });
    return res.status(200).json({ session: data.session, user: data.user });
});

router.post('/signout', async (req: Request, res: Response) => {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
});

export default router;