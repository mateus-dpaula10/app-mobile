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
        $request->merge([
            'price' => str_replace(',', '.', $request->price)
        ]);

        $request->validate([
            'name'                    => 'required|string|max:255',
            'description'             => 'nullable|string',
            'price'                   => 'required|numeric|min:0',
            'stock_quantity'          => 'required|integer|min:0',
            'images.*'                => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ], [
            'name.required'           => 'O campo nome é obrigatório.',
            'price.required'          => 'O campo preço é obrigatório.',
            'price.numeric'           => 'O campo preço deve ser um número.',
            'price.min'               => 'O campo preço deve ser no mínimo 0.',
            'stock_quantity.required' => 'O campo quantidade de estoque é obrigatório.',
            'stock_quantity.integer'  => 'O campo quantidade de estoque deve ser um número inteiro.',
            'stock_quantity.min'      => 'O campo quantidade de estoque deve ser no mínimo 0.',
            'images.*.image'          => 'Cada arquivo deve ser uma imagem.',
            'images.*.mimes'          => 'As imagens devem estar no formato jpg, jpeg ou png.',
            'images.*.max'            => 'Cada imagem não pode ultrapassar 2MB.'
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
        $request->merge([
            'price' => str_replace(',', '.', $request->price)
        ]);
        
        $request->validate([
            'name'                     => 'required|string|max:255',
            'description'              => 'nullable|string',
            'price'                    => 'required|numeric|min:0',
            'stock_quantity'           => 'required|integer|min:0',
            'images.*'                 => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'existing_images.'         => 'nullable|array'
        ], [
            'name.required'            => 'O campo nome é obrigatório.',
            'price.required'           => 'O campo preço é obrigatório.',
            'price.numeric'            => 'O campo preço deve ser um número.',
            'price.min'                => 'O campo preço deve ser no mínimo 0.',
            'stock_quantity.required'  => 'O campo quantidade de estoque é obrigatório.',
            'stock_quantity.integer'   => 'O campo quantidade de estoque deve ser um número inteiro.',
            'stock_quantity.min'       => 'O campo quantidade de estoque deve ser no mínimo 0.',
            'images.*.image'           => 'Cada arquivo deve ser uma imagem.',
            'images.*.mimes'           => 'As imagens devem estar no formato jpg, jpeg ou png.',
            'images.*.max'             => 'Cada imagem não pode ultrapassar 2MB.',
            'existing_images.array'    => 'As imagens existentes devem ser enviadas em formato de lista.',
            'existing_images.*.string' => 'Cada imagem existente deve ser identificada por um caminho válido.'
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
