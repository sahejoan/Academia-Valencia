<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\AuthorityController;
use App\Http\Controllers\AnalyticsController;

/*
|--------------------------------------------------------------------------
| API Routes - Academia Valencia
|--------------------------------------------------------------------------
| Rutas para el Frontend React 18 / TypeScript
| Consumibles desde http://localhost/api o http://localhost:8000/api
*/

// Autenticación pública
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

// Cursos y Asignaturas
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show']);
Route::post('/courses', [CourseController::class, 'store']);
Route::put('/courses/{id}', [CourseController::class, 'update']);
Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
Route::put('/courses/{id}/schedule-start', [CourseController::class, 'scheduleStartDate']);

// Calificaciones (Evaluación Vigesimal 1 al 20, 4 Cortes de 25%)
Route::get('/grades', [GradeController::class, 'index']);
Route::get('/grades/course/{courseId}', [GradeController::class, 'getByCourse']);
Route::get('/grades/student/{studentId}', [GradeController::class, 'getByStudent']);
Route::put('/grades/{id}', [GradeController::class, 'updateGrade']);
Route::post('/grades/batch-update', [GradeController::class, 'batchUpdate']);

// Inscripciones
Route::get('/enrollments', [EnrollmentController::class, 'index']);
Route::post('/enrollments', [EnrollmentController::class, 'store']);
Route::delete('/enrollments/{id}', [EnrollmentController::class, 'destroy']);

// Configuración Institucional de Autoridades (Firmas de Actas)
Route::get('/authority-settings', [AuthorityController::class, 'show']);
Route::put('/authority-settings', [AuthorityController::class, 'update']);

// Analíticas y KPIs
Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
