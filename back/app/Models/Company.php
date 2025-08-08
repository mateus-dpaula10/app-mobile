<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'legal_name',
        'cnpj',
        'phone',
        'address',
        'plan',
        'active'
    ];

    public function admin()
    {
        return $this->hasOne(User::class)->where('role', 'store');
    }
}
