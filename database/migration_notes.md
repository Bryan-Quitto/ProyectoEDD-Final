# Notas de Migración del Schema

## Cambios Realizados para Compatibilidad con el Servidor

### 1. Tabla `users`
- **Cambio**: `name` → `full_name`
- **Razón**: El servidor espera el campo `full_name` según los tipos TypeScript

### 2. Tabla `courses`
- **Agregado**: `difficulty_level` (VARCHAR(50)) con CHECK constraint
- **Agregado**: `estimated_duration` (INTEGER) en minutos
- **Cambio**: `instructor_id` → `teacher_id`
- **Razón**: El servidor usa estos campos en el CourseController

### 3. Tabla `lessons`
- **Cambio**: `content_type` → `lesson_type`
- **Cambio**: `duration_minutes` → `estimated_duration`
- **Actualizado**: Valores permitidos en CHECK constraint
- **Razón**: El servidor espera `lesson_type` con valores específicos

### 4. Tabla `evaluations`
- **Agregado**: `description` (TEXT)
- **Agregado**: `evaluation_type` (VARCHAR(50)) con CHECK constraint
- **Agregado**: `max_score` (INTEGER) con valor por defecto 100
- **Razón**: El servidor necesita estos campos para el sistema de evaluaciones

### 5. Tabla `evaluation_attempts`
- **Cambio**: `user_id` → `student_id`
- **Agregado**: `max_score` (INTEGER)
- **Agregado**: `percentage` (DECIMAL(5,2))
- **Agregado**: `passed` (BOOLEAN)
- **Agregado**: `started_at` (TIMESTAMP)
- **Agregado**: `created_at` (TIMESTAMP)
- **Cambio**: `time_spent_minutes` → `time_taken_minutes`
- **Razón**: El servidor necesita estos campos para el seguimiento de intentos

### 6. Tabla `student_progress`
- **Cambio**: `user_id` → `student_id`
- **Cambio**: `completion_percentage` → `progress_percentage`
- **Cambio**: `time_spent_minutes` → `time_spent`
- **Cambio**: `last_accessed_at` → `last_accessed`
- **Agregado**: `created_at` y `updated_at`
- **Razón**: Consistencia con los tipos TypeScript del servidor

### 7. Tabla `performance_states`
- **Cambio**: `user_id` → `student_id`
- **Cambio**: `evaluation_id` → `course_id`
- **Eliminado**: `performance_level` y `final_score`
- **Agregado**: Campos completos para el sistema de recomendaciones:
  - `overall_progress` (INTEGER)
  - `average_score` (INTEGER)
  - `total_time_spent` (INTEGER)
  - `lessons_completed` (INTEGER)
  - `evaluations_passed` (INTEGER)
  - `current_difficulty` (VARCHAR(50))
  - `learning_pace` (VARCHAR(50))
  - `last_activity` (TIMESTAMP)
- **Razón**: El sistema de recomendaciones necesita estos campos para el árbol de decisión

### 8. Tabla `recommendations`
- **Cambio**: `user_id` → `student_id`
- **Cambio**: `lesson_id` → `recommended_content_id` (opcional)
- **Eliminado**: `reason` y `is_active`
- **Agregado**: Campos completos para el sistema de recomendaciones:
  - `title` (VARCHAR(255))
  - `description` (TEXT)
  - `recommended_content_type` (VARCHAR(50))
  - `priority` (VARCHAR(50))
  - `is_read` (BOOLEAN)
  - `is_applied` (BOOLEAN)
  - `expires_at` (TIMESTAMP)
- **Actualizado**: `recommendation_type` con nuevos valores
- **Razón**: El RecommendationService necesita estos campos para gestionar recomendaciones

### 9. Índices
- **Actualizados**: Todos los índices para usar los nuevos nombres de campos
- **Agregados**: Nuevos índices para optimizar consultas frecuentes
- **Razón**: Mejorar el rendimiento de las consultas del servidor

### 10. Funciones y Triggers
- **Agregado**: Función `calculate_performance_metrics` para el sistema de recomendaciones
- **Agregado**: Trigger `update_updated_at_column` para mantener timestamps automáticamente
- **Actualizado**: Función `search_content` para incluir descripciones de evaluaciones
- **Razón**: Automatizar cálculos y mantener consistencia de datos

## Compatibilidad con el Servidor

El schema actualizado es ahora completamente compatible con:
- **CourseController**: Todas las operaciones CRUD de cursos
- **RecommendationController**: Sistema completo de recomendaciones
- **RecommendationService**: Lógica de negocio para recomendaciones
- **DecisionTree**: Árbol de decisión para generar recomendaciones
- **Tipos TypeScript**: Todas las interfaces definidas en `src/types/index.ts`

## Notas de Implementación

1. **Migración de Datos**: Si ya existen datos, será necesario crear un script de migración
2. **Validaciones**: Los CHECK constraints aseguran la integridad de los datos
3. **Rendimiento**: Los índices optimizan las consultas más frecuentes
4. **Escalabilidad**: El diseño permite el crecimiento del sistema 