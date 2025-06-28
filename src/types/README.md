# Tipos TypeScript - Documentación

## Descripción General

Este archivo contiene todas las interfaces TypeScript utilizadas por el servidor de la plataforma educativa. Los tipos están diseñados para ser completamente compatibles con:

1. **Schema de la base de datos** (`database/schema.sql`)
2. **Código del servidor** (`server/src/`)
3. **Frontend** (`src/`)

## Tipos Principales

### 1. Entidades de Usuario

#### `User`
- **Uso**: Representa usuarios del sistema (estudiantes, profesores, administradores)
- **Campos clave**: `id`, `email`, `full_name`, `role`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

### 2. Entidades de Contenido

#### `Course`
- **Uso**: Cursos disponibles en la plataforma
- **Campos clave**: `title`, `description`, `difficulty_level`, `teacher_id`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor (CourseController)

#### `Module`
- **Uso**: Módulos que componen un curso
- **Campos clave**: `course_id`, `title`, `order_index`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

#### `Lesson`
- **Uso**: Lecciones individuales dentro de un módulo
- **Campos clave**: `module_id`, `title`, `lesson_type`, `content`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

#### `Evaluation`
- **Uso**: Evaluaciones asociadas a lecciones
- **Campos clave**: `lesson_id`, `title`, `evaluation_type`, `questions`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

### 3. Entidades de Seguimiento

#### `EvaluationAttempt`
- **Uso**: Intentos de evaluación realizados por estudiantes
- **Campos clave**: `evaluation_id`, `student_id`, `score`, `passed`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

#### `StudentProgress`
- **Uso**: Progreso de estudiantes en lecciones
- **Campos clave**: `student_id`, `lesson_id`, `status`, `progress_percentage`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor

#### `PerformanceState`
- **Uso**: Estado de rendimiento general del estudiante en un curso
- **Campos clave**: `student_id`, `course_id`, `overall_progress`, `average_score`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor (RecommendationService)

### 4. Sistema de Recomendaciones

#### `Recommendation`
- **Uso**: Recomendaciones generadas para estudiantes
- **Campos clave**: `student_id`, `recommendation_type`, `title`, `priority`
- **Compatibilidad**: ✅ Base de datos, ✅ Servidor (RecommendationService)

#### `DecisionNode` y `RecommendationAction`
- **Uso**: Árbol de decisión para generar recomendaciones
- **Compatibilidad**: ✅ Servidor (DecisionTree)

### 5. Tipos de Respuesta API

#### `ApiResponse<T>`
- **Uso**: Respuestas estándar de la API
- **Campos**: `success`, `data`, `error`, `message`
- **Compatibilidad**: ✅ Servidor (todos los controllers)

#### `PaginatedResponse<T>`
- **Uso**: Respuestas paginadas
- **Campos**: `data`, `total`, `page`, `limit`, `totalPages`
- **Compatibilidad**: ✅ Servidor (CourseController, RecommendationService)

### 6. Tipos de Filtros

#### `CourseFilters`
- **Uso**: Filtros para búsqueda de cursos
- **Compatibilidad**: ✅ Servidor (CourseController)

#### `StudentFilters`
- **Uso**: Filtros para búsqueda de estudiantes
- **Compatibilidad**: ✅ Servidor

### 7. Tipos de Creación/Actualización

#### `CreateCourseData`
- **Uso**: Datos para crear un nuevo curso
- **Compatibilidad**: ✅ Servidor (CourseController.createCourse)

#### `UpdateCourseData`
- **Uso**: Datos para actualizar un curso existente
- **Compatibilidad**: ✅ Servidor (CourseController.updateCourse)

#### `CreateRecommendationData`
- **Uso**: Datos para crear una nueva recomendación
- **Compatibilidad**: ✅ Servidor (RecommendationService)

#### `UpdatePerformanceStateData`
- **Uso**: Datos para actualizar el estado de rendimiento
- **Compatibilidad**: ✅ Servidor (RecommendationService)

## Cambios Recientes

### Versión Actual (Compatible con Servidor)

1. **Correcciones de campos**:
   - `Lesson.content_url`: Agregado como opcional
   - `Evaluation.max_attempts`: Agregado como requerido
   - `Evaluation.time_limit_minutes`: Renombrado de `time_limit`
   - `EvaluationAttempt.attempt_number`: Agregado como requerido
   - `EvaluationAttempt.time_taken_minutes`: Renombrado de `time_taken`

2. **Tipos de creación/actualización**:
   - Agregados para mejorar la tipificación en operaciones CRUD
   - Separación clara entre datos de creación y actualización

3. **Compatibilidad total**:
   - Todos los tipos coinciden exactamente con el schema de la base de datos
   - Todos los tipos son utilizados por el código del servidor
   - No hay tipos no utilizados o redundantes

## Uso en el Servidor

### Importaciones Principales

```typescript
// CourseController
import { Course, ApiResponse, PaginatedResponse } from '../../../src/types';

// RecommendationService
import type { 
  PerformanceState,
  Recommendation,
  RecommendationAction,
  ApiResponse,
  PaginatedResponse
} from '../../../src/types';

// DecisionTree
import { DecisionNode, RecommendationAction, PerformanceState } from '../../../src/types';
```

### Validación de Tipos

Todos los tipos están validados contra:
- ✅ Schema de PostgreSQL
- ✅ Código del servidor
- ✅ Operaciones de Supabase
- ✅ Respuestas de API

## Mantenimiento

Para mantener la compatibilidad:

1. **Antes de modificar tipos**: Verificar uso en servidor
2. **Después de cambios en BD**: Actualizar tipos correspondientes
3. **Nuevas funcionalidades**: Agregar tipos antes de implementar
4. **Validación**: Usar TypeScript strict mode

## Notas Técnicas

- **Tipos estrictos**: Todos los tipos son interfaces TypeScript
- **Union types**: Para campos con valores específicos
- **Opcionales**: Marcados con `?` cuando corresponde
- **Documentación**: Comentarios en línea para campos complejos 