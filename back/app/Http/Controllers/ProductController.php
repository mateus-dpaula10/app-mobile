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
        $products = Product::where('company_id', auth()->user()->company_id)->with('images')->get();
        
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
                $product->images()->create([
                    'image_path' => $path
                ]);
            }
        }

        return response()->json($product->load('images'), 201);
    }

    public function update(Request $request, Product $product) 
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'price'            => 'required|numeric|min:0',
            'stock_quantity'   => 'required|integer|min:0',
            'images.*'         => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'existing_images.' => 'nullable|array'
        ]);

        $product->update($request->only('name', 'description', 'price', 'stock_quantity'));

        $existingImages = $request->input('existing_images', []);
        $product->images()
            ->whereNotIn('image_path', $existingImages)
            ->each(function ($img) {
                Storage::disk('public')->delete($img->image_path);
                $img->delete();
            });

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $product->images()->create([
                    'image_path' => $path
                ]);
            }
        }

        return response()->json($product->load('images'), 201);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        
        return response()->json(['message' => 'Produto removido']);
    }
}
