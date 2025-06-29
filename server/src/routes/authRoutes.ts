import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, full_name, role } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role: role || 'student' } },
  });
  if (error) return res.status(400).json({ message: error.message });
  return res.status(201).json(data.user);
});

router.post('/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }
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