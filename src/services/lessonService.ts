import { supabase } from "./supabase";
import type { Lesson } from "@plataforma-educativa/types";

const getLessonById = async (id: string) => {
    return supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single<Lesson>();
};

export const lessonService = {
    getLessonById,
};