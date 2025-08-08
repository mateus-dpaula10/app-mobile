<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProductController;

Route::post('/login', [AuthController::class, 'login'])->name('auth.login');


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/companies', [CompanyController::class, 'index'])->name('company.index');
    Route::post('/companies', [CompanyController::class, 'store'])->name('company.store');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('company.update');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('company.destroy');
    
    Route::get('/products', [ProductController::class, 'index'])->name('product.index');
    Route::post('/products', [ProductController::class, 'store'])->name('product.store');
});