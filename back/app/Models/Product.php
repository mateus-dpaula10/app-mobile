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
        'variations',
        'company_id',
        'category_id'
    ];

    protected $casts = [
        'variations' => 'array'
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

    public function variations()
    {
        return $this->hasMany(ProductVariation::class);
    }
}
