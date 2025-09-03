<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\User;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::with('admin')->get();
        
        return response()->json($companies);
    }

    public function store(Request $request)
    {
        $request->validate([
            'legal_name'     => 'required|string|max:255',
            'final_name'     => 'required|string|max:255',
            'cnpj'           => 'required|string|unique:companies,cnpj',
            'admin.email'    => 'required|email|unique:users,email',
            'admin.name'     => 'required|string|max:255',
            'admin.password' => 'required|min:8'
        ], [
            'legal_name.required'        => 'O nome empresarial é obrigatório.',
            'final_name.required'        => 'O nome real da loja é obrigatório.',
            'cnpj.required'              => 'O campo CNPJ é obrigatório.',
            'cnpj.unique'                => 'Este CNPJ já está cadastrado.',
            'admin.email.required'       => 'O e-mail do administrador é obrigatório.',
            'admin.email.email'          => 'O e-mail do administrador deve ser um e-mail válido.',
            'admin.email.unique'         => 'Este e-mail já está em uso.',
            'admin.name.required'        => 'O nome do administrador é obrigatório.',
            'admin.name.max'             => 'O nome do administrador não pode ter mais de :max caracteres.',
            'admin.password.required'    => 'A senha é obrigatória.',
            'admin.password.min'         => 'A senha deve ter pelo menos :min caracteres.'
        ]);

        $company = Company::create($request->only([
            'legal_name', 'final_name', 'cnpj', 'phone', 'address', 'plan'
        ]));

        $admin = new User([
            'name' => $request->admin['name'],
            'email' => $request->admin['email'],
            'password' => bcrypt($request->admin['password']),
            'role' => 'store'
        ]);

        $admin->company()->associate($company);
        $admin->save();

        return response()->json(['company' => $company, 'admin' => $admin], 201);
    }

    public function update(Request $request, Company $company)
    {
        $request->validate([
            'legal_name'     => 'sometimes|string|max:255',
            'final_name'     => 'sometimes|string|max:255',
            'cnpj'           => 'sometimes|string|unique:companies,cnpj,' . $company->id,
            'phone'          => 'nullable|string',
            'address'        => 'nullable|string',
            'plan'           => 'nullable|string',
            'admin.email'    => 'sometimes|email|unique:users,email,' . ($company->admin->id ?? 'null'),
            'admin.name'     => 'sometimes|string|max:255',
            'admin.password' => ['nullable', 'string', 'min:6', function ($attribute, $value, $fail) {
                if (trim($value) === '') {
                    $fail('A senha não pode estar em branco.');
                }
            }]
        ], [
            'legal_name.max'             => 'O nome empresarial não pode ter mais de :max caracteres.',
            'final_name.max'             => 'O nome real da loja não pode ter mais de :max caracteres.',
            'cnpj.unique'                => 'Este CNPJ já está em uso por outra empresa.',
            'admin.email.email'          => 'Informe um e-mail válido.',
            'admin.email.unique'         => 'Este e-mail já está sendo utilizado.',
            'admin.name.max'             => 'O nome do administrador não pode ter mais de :max caracteres.',
            'admin.password.min'         => 'A nova senha deve ter pelo menos :min caracteres.'
        ]);

        $company->update($request->only([
            'legal_name', 'final_name', 'cnpj', 'phone', 'address', 'plan'
        ]));

        if ($request->has('admin') && $company->admin) {
            $admin = $company->admin;
            $admin->fill([
                'name'  => $request->admin['name'] ?? $admin->name,
                'email' => $request->admin['email'] ?? $admin->email
            ]);

            if (!empty($request->admin['password'])) {
                $admin->password = bcrypt($request->admin['password']);
            }

            $admin->save();
        }
        
        return response()->json(['company' => $company]);
    }

    public function destroy(Company $company)
    {
        $company->admin()->delete();

        $company->delete();
        
        return response()->json(['message' => 'Empresa excluída com sucesso.']);
    }
    
    public function companies()
    {
        $companies = Company::with(['products.images'])
            ->where('active', true)
            ->get();
        
        return response()->json($companies);
    }
}
