<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Grade;

class GradeController extends Controller
{
    /**
     * Lista general de calificaciones
     */
    public function index(Request $request)
    {
        $query = DB::table('calificaciones')
            ->join('usuarios', 'calificaciones.estudiante_id', '=', 'usuarios.id')
            ->join('cursos', 'calificaciones.curso_id', '=', 'cursos.id')
            ->select(
                'calificaciones.id',
                'calificaciones.inscripcion_id as enrollmentId',
                'calificaciones.estudiante_id as studentId',
                'usuarios.nombre as studentName',
                'usuarios.codigo as studentCode',
                'usuarios.cedula as studentCedula',
                'calificaciones.curso_id as courseId',
                'cursos.codigo as courseCode',
                'cursos.nombre as courseName',
                'calificaciones.evaluacion1',
                'calificaciones.evaluacion2',
                'calificaciones.evaluacion3',
                'calificaciones.evaluacion4',
                'calificaciones.nota_final as notaFinal',
                'calificaciones.acumulado',
                'calificaciones.estado'
            );

        if ($request->has('course_id')) {
            $query->where('calificaciones.curso_id', $request->query('course_id'));
        }

        return response()->json($query->get());
    }

    /**
     * Actualiza las calificaciones de un estudiante con cálculo automático
     */
    public function updateGrade(Request $request, $id)
    {
        $request->validate([
            'evaluacion1' => 'nullable|numeric|min:0|max:20',
            'evaluacion2' => 'nullable|numeric|min:0|max:20',
            'evaluacion3' => 'nullable|numeric|min:0|max:20',
            'evaluacion4' => 'nullable|numeric|min:0|max:20',
        ]);

        $eval1 = $request->input('evaluacion1');
        $eval2 = $request->input('evaluacion2');
        $eval3 = $request->input('evaluacion3');
        $eval4 = $request->input('evaluacion4');

        // Cálculo del acumulado (ponderación 25% por cada corte)
        $evals = array_filter([$eval1, $eval2, $eval3, $eval4], fn($v) => !is_null($v));
        $acumulado = null;
        $notaFinal = null;

        if (count($evals) > 0) {
            $acumulado = round(
                (floatval($eval1 ?? 0) * 0.25) +
                (floatval($eval2 ?? 0) * 0.25) +
                (floatval($eval3 ?? 0) * 0.25) +
                (floatval($eval4 ?? 0) * 0.25),
                2
            );
            $notaFinal = $acumulado;
        }

        $estado = 'En curso';
        if (count($evals) === 4) {
            $estado = ($notaFinal >= 10.0) ? 'Aprobado' : 'Reprobado';
        }

        DB::table('calificaciones')
            ->where('id', $id)
            ->update([
                'evaluacion1' => $eval1,
                'evaluacion2' => $eval2,
                'evaluacion3' => $eval3,
                'evaluacion4' => $eval4,
                'nota_final' => $notaFinal,
                'acumulado' => $acumulado,
                'estado' => $estado,
                'fecha_actualizacion' => now()
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Calificación actualizada satisfactoriamente',
            'data' => [
                'id' => $id,
                'evaluacion1' => $eval1,
                'evaluacion2' => $eval2,
                'evaluacion3' => $eval3,
                'evaluacion4' => $eval4,
                'notaFinal' => $notaFinal,
                'acumulado' => $acumulado,
                'estado' => $estado
            ]
        ]);
    }
}
