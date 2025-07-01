import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabaseAdmin';

const router = Router();

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role, date_of_birth, national_id, phone_number } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ message: "Faltan campos requeridos." });
      return;
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

    res.status(201).json({ message: "Usuario creado exitosamente. Por favor, revisa tu correo para confirmar." });

  } catch (error: any) {
    console.error('--- ERROR EN /signup ---', error);
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      res.status(409).json({ message: 'Un usuario con este email ya existe.' });
    } else {
      res.status(500).json({ message: error.message || 'Ocurrió un error en el servidor.' });
    }
  }
});

router.post('/signin', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      res.status(401).json({ message: error.message });
    } else {
      res.status(200).json({ session: data.session, user: data.user });
    }
});

router.post('/signout', async (req: Request, res: Response): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    }
});

export default router;