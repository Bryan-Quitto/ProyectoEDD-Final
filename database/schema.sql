-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cursos
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER NOT NULL DEFAULT 0, -- en minutos
    teacher_id UUID REFERENCES users(id),
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
    lesson_type VARCHAR(50) NOT NULL CHECK (lesson_type IN ('video', 'text', 'interactive', 'quiz')),
    content_url VARCHAR(500),
    estimated_duration INTEGER DEFAULT 0, -- en minutos
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
    description TEXT,
    evaluation_type VARCHAR(50) NOT NULL CHECK (evaluation_type IN ('quiz', 'assignment', 'project')),
    questions JSONB NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
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
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evaluation_id, student_id, attempt_number)
);

-- Tabla de progreso del estudiante
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- en minutos
    last_accessed TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Tabla de estados de rendimiento
CREATE TABLE performance_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    overall_progress INTEGER NOT NULL DEFAULT 0, -- 0-100
    average_score INTEGER NOT NULL DEFAULT 0, -- 0-100
    total_time_spent INTEGER NOT NULL DEFAULT 0, -- en minutos
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    evaluations_passed INTEGER NOT NULL DEFAULT 0,
    current_difficulty VARCHAR(50) NOT NULL DEFAULT 'beginner' CHECK (current_difficulty IN ('beginner', 'intermediate', 'advanced')),
    learning_pace VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (learning_pace IN ('slow', 'normal', 'fast')),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Tabla de recomendaciones
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('content', 'study_plan', 'difficulty_adjustment')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommended_content_id UUID,
    recommended_content_type VARCHAR(50) CHECK (recommended_content_type IN ('lesson', 'course', 'evaluation')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX idx_modules_course ON modules(course_id, order_index);
CREATE INDEX idx_lessons_module ON lessons(module_id, order_index);
CREATE INDEX idx_lessons_type ON lessons(lesson_type);
CREATE INDEX idx_evaluations_lesson ON evaluations(lesson_id);
CREATE INDEX idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX idx_attempts_student_eval ON evaluation_attempts(student_id, evaluation_id);
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_performance_student ON performance_states(student_id);
CREATE INDEX idx_performance_course ON performance_states(course_id);
CREATE INDEX idx_recommendations_student ON recommendations(student_id, is_read);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);

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
    
    SELECT 'evaluation'::TEXT, e.id, e.title, e.description, c.title
    FROM evaluations e
    JOIN lessons l ON e.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE e.title ILIKE '%' || search_term || '%' 
       OR e.description ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Función para calcular estadísticas de rendimiento
CREATE OR REPLACE FUNCTION calculate_performance_metrics(
    p_student_id UUID,
    p_course_id UUID
) RETURNS TABLE (
    overall_progress INTEGER,
    average_score INTEGER,
    total_time_spent INTEGER,
    lessons_completed INTEGER,
    evaluations_passed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH progress_stats AS (
        SELECT 
            COUNT(*) as total_lessons,
            COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) as completed_lessons,
            COALESCE(SUM(sp.time_spent), 0) as total_time,
            COALESCE(ROUND(AVG(sp.progress_percentage)), 0) as avg_progress
        FROM student_progress sp
        JOIN lessons l ON sp.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        WHERE sp.student_id = p_student_id AND m.course_id = p_course_id
    ),
    evaluation_stats AS (
        SELECT 
            COUNT(*) as total_attempts,
            COUNT(CASE WHEN ea.passed THEN 1 END) as passed_evaluations,
            COALESCE(ROUND(AVG(ea.percentage)), 0) as avg_score
        FROM evaluation_attempts ea
        JOIN evaluations e ON ea.evaluation_id = e.id
        JOIN lessons l ON e.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        WHERE ea.student_id = p_student_id AND m.course_id = p_course_id
    )
    SELECT 
        ps.avg_progress::INTEGER,
        es.avg_score::INTEGER,
        ps.total_time::INTEGER,
        ps.completed_lessons::INTEGER,
        es.passed_evaluations::INTEGER
    FROM progress_stats ps, evaluation_stats es;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas que tienen updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_states_updated_at BEFORE UPDATE ON performance_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();