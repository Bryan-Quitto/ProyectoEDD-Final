import { supabase } from "./supabase";
import type { Lesson } from "../types";

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