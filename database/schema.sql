-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cursos
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de módulos
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de lecciones
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'video', 'pdf', 'html')),
    content_url VARCHAR(500),
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de evaluaciones
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de intentos de evaluación
CREATE TABLE evaluation_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    time_spent_minutes INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evaluation_id, user_id, attempt_number)
);

-- Tabla de progreso del estudiante
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    time_spent_minutes INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, lesson_id)
);

-- Tabla de estados de rendimiento
CREATE TABLE performance_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    performance_level VARCHAR(50) NOT NULL CHECK (performance_level IN ('low', 'medium', 'high')),
    final_score INTEGER NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, evaluation_id)
);

-- Tabla de recomendaciones
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('regular', 'reinforcement', 'advanced', 'extra_material')),
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_modules_course ON modules(course_id, order_index);
CREATE INDEX idx_lessons_module ON lessons(module_id, order_index);
CREATE INDEX idx_evaluations_lesson ON evaluations(lesson_id);
CREATE INDEX idx_attempts_user_eval ON evaluation_attempts(user_id, evaluation_id);
CREATE INDEX idx_progress_user ON student_progress(user_id);
CREATE INDEX idx_performance_user ON performance_states(user_id);
CREATE INDEX idx_recommendations_user ON recommendations(user_id, is_active);

-- Función para buscar contenido
CREATE OR REPLACE FUNCTION search_content(search_term TEXT)
RETURNS TABLE (
    content_type TEXT,
    id UUID,
    title TEXT,
    description TEXT,
    course_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'course'::TEXT, c.id, c.title, c.description, c.title
    FROM courses c
    WHERE c.title ILIKE '%' || search_term || '%' 
       OR c.description ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    SELECT 'module'::TEXT, m.id, m.title, m.description, c.title
    FROM modules m
    JOIN courses c ON m.course_id = c.id
    WHERE m.title ILIKE '%' || search_term || '%' 
       OR m.description ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    SELECT 'lesson'::TEXT, l.id, l.title, l.content, c.title
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE l.title ILIKE '%' || search_term || '%' 
       OR l.content ILIKE '%' || search_term || '%'
    
    UNION ALL
    
    SELECT 'evaluation'::TEXT, e.id, e.title, ''::TEXT, c.title
    FROM evaluations e
    JOIN lessons l ON e.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE e.title ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;