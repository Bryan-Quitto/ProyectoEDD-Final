import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ModuleCompletionPayload {
  student_id: string;
  lesson_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ModuleCompletionPayload = await req.json();
    const { student_id, lesson_id } = payload;

    if (!student_id || !lesson_id) {
      throw new Error("Faltan student_id o lesson_id en el payload.");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Lección no encontrada: ${lesson_id}`);
    }

    const { module_id } = lesson;

    const { data: moduleLessons, error: moduleLessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('module_id', module_id);

    if (moduleLessonsError) throw moduleLessonsError;

    const moduleLessonIds = moduleLessons.map(l => l.id);

    const { data: completedLessons, error: progressError } = await supabase
      .from('student_progress')
      .select('lesson_id')
      .eq('student_id', student_id)
      .in('lesson_id', moduleLessonIds)
      .eq('status', 'completed');

    if (progressError) throw progressError;

    if (completedLessons.length !== moduleLessonIds.length) {
      return new Response(JSON.stringify({ message: 'Módulo aún no completado. No se generan recomendaciones.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from('evaluation_attempts')
      .select('percentage')
      .eq('student_id', student_id)
      .in('evaluation_id', (
        await supabase.from('evaluations').select('id').in('lesson_id', moduleLessonIds)
      ).data?.map(e => e.id) || []);

    if (attemptsError) throw attemptsError;

    let averageScore = 100; // Default to high performance if no evaluations
    if (attempts && attempts.length > 0) {
      const total = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
      averageScore = Math.round(total / attempts.length);
    }
    
    let performance_level: 'low' | 'average' | 'high' = 'high';
    if (averageScore < 60) performance_level = 'low';
    else if (averageScore < 90) performance_level = 'average';

    const { data: courseData } = await supabase.from('modules').select('course_id').eq('id', module_id).single();
    const course_id = courseData?.course_id;

    if (performance_level === 'high') {
      await supabase.from('recommendations').insert({
        student_id,
        course_id,
        recommendation_type: 'praise',
        title: '¡Módulo Completado con Éxito!',
        description: '¡Felicidades! Tuviste un excelente rendimiento en este módulo y no necesitas material de apoyo adicional. ¡Sigue así!',
        priority: 'medium'
      });
    } else {
      const { data: resources, error: resourcesError } = await supabase
        .from('module_support_resources')
        .select('*')
        .eq('module_id', module_id)
        .eq('performance_level', performance_level);

      if (resourcesError) throw resourcesError;

      if (resources && resources.length > 0) {
        const newRecommendations = resources.map(res => ({
          student_id,
          course_id,
          recommendation_type: 'support_material',
          title: `Recurso de Apoyo: ${res.title}`,
          description: `Detectamos que podrías beneficiarte de un repaso. Aquí tienes un recurso útil: ${res.title}.`,
          priority: 'high',
          recommended_content_id: res.id,
          recommended_content_type: res.resource_type,
          action_url: res.url
        }));
        await supabase.from('recommendations').insert(newRecommendations);
      }
    }
    
    return new Response(JSON.stringify({ message: `Módulo completado. Rendimiento: ${performance_level}. Recomendaciones procesadas.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});