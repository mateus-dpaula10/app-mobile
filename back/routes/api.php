<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\DriverOrderController;

Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/register', [AuthController::class, 'register'])->name('auth.register');

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/clients/updateProfile', [AuthController::class, 'update'])->name('clients.update');

    Route::get('/companies', [CompanyController::class, 'index'])->name('company.index');
    Route::post('/companies', [CompanyController::class, 'store'])->name('company.store');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('company.update');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('company.destroy');
    Route::get('/companies-with-products', [CompanyController::class, 'companies'])->name('company.companies');
    
    Route::get('/companies/me', [CompanyController::class, 'myCompany'])->name('company.myCompany');
    Route::post('/companies/addInfo', [CompanyController::class, 'addInfo'])->name('company.addInfo');
    
    Route::get('/categories', [ProductController::class, 'getCategories'])->name('product.getCategories');
    Route::get('/products', [ProductController::class, 'index'])->name('product.index');
    Route::post('/products', [ProductController::class, 'store'])->name('product.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('product.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('product.destroy');

    Route::get('/cart', [ProductController::class, 'getCart'])->name('product.getCart');
    Route::post('/cart', [ProductController::class, 'addCart'])->name('product.addCart');
    Route::delete('/cart/items/{item}', [ProductController::class, 'removeItem'])->name('product.removeItem');
    Route::put('/cart/items/{item}/increment', [ProductController::class, 'incrementItem'])->name('product.incrementItem');
    Route::put('/cart/items/{item}/decrement', [ProductController::class, 'decrementItem'])->name('product.decrementItem');
    Route::post('/cart/checkout', [ProductController::class, 'checkout'])->name('product.checkout');

    Route::get('/orders', [ProductController::class, 'getOrders'])->name('product.getOrders');
    Route::get('/orders-store', [ProductController::class, 'getStoreOrders'])->name('product.getStoreOrders');
    Route::patch('/orders-store/{order}/status', [ProductController::class, 'updateStoreOrders'])->name('product.updateStoreOrders');

    Route::get('/orders-driver', [DriverOrderController::class, 'index'])->name('driver.order.index');
    Route::patch('/orders-driver/{order}/accept', [DriverOrderController::class, 'acceptOrder'])->name('driver.order.acceptOrder');
    Route::patch('/orders-driver/{order}/status', [DriverOrderController::class, 'updateStatus'])->name('driver.order.updateStatus');
});