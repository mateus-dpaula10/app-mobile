<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductImage;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::where('company_id', auth()->user()->company_id)->get();
        
        return response()->json($products);
    }

    public function store(Request $request) 
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'images.*'       => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        $product = Product::create([
            'company_id'     => auth()->user()->company_id,
            'name'           => $request->name,
            'description'    => $request->description,
            'price'          => $request->price,
            'stock_quantity' => $request->stock_quantity
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path
                ]);
            }
        }

        return response()->json($product->load('images'), 201);
    }
}
