<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthorityController extends Controller
{
    /**
     * Obtiene la autoridad institucional configurada para firmas de actas
     */
    public function show()
    {
        $authority = DB::table('autoridades_institucionales')->first();

        if (!$authority) {
            return response()->json([
                'authorityName' => 'Dra. Carmen Rodríguez',
                'authorityTitle' => 'Directora de Control de Estudios y Evaluación',
                'authorityCedula' => 'V-11.234.567',
                'authorityDepartment' => 'Dirección de Control Académico y Secretaría General',
                'resolutionNumber' => 'RES-DIR-ACAD-2026-004'
            ]);
        }

        return response()->json([
            'authorityName' => $authority->nombre_autoridad,
            'authorityTitle' => $authority->cargo_autoridad,
            'authorityCedula' => $authority->cedula_autoridad,
            'authorityDepartment' => $authority->departamento_autoridad,
            'resolutionNumber' => $authority->resolucion_acta,
            'phone' => $authority->telefono_contacto,
            'email' => $authority->email_institucional
        ]);
    }

    /**
     * Actualiza los datos de la autoridad institucional
     */
    public function update(Request $request)
    {
        $request->validate([
            'authorityName' => 'required|string|max:150',
            'authorityTitle' => 'required|string|max:150',
            'authorityCedula' => 'required|string|max:50',
            'authorityDepartment' => 'required|string|max:150',
        ]);

        $exists = DB::table('autoridades_institucionales')->first();

        $data = [
            'nombre_autoridad' => $request->input('authorityName'),
            'cargo_autoridad' => $request->input('authorityTitle'),
            'cedula_autoridad' => $request->input('authorityCedula'),
            'departamento_autoridad' => $request->input('authorityDepartment'),
            'resolucion_acta' => $request->input('resolutionNumber', 'RES-DIR-ACAD-2026-004'),
            'updated_at' => now()
        ];

        if ($exists) {
            DB::table('autoridades_institucionales')->where('id', $exists->id)->update($data);
        } else {
            $data['id'] = 'default-authority';
            DB::table('autoridades_institucionales')->insert($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Configuración de autoridades institucionales actualizada con éxito',
            'data' => $request->all()
        ]);
    }
}
