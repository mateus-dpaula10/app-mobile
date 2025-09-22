<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'stock_quantity',
        'status',
        'free_shipping',
        'first_purchase_discount_store',
        'first_purchase_discount_app',
        'weighable',
        'variations',
        'company_id',
        'category_id'
    ];

    protected $casts = [
        'free_shipping'                 => 'boolean',
        'first_purchase_discount_store' => 'boolean',
        'first_purchase_discount_app'   => 'boolean',
        'weighable'                     => 'boolean',
        'variations'                    => 'array'
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
