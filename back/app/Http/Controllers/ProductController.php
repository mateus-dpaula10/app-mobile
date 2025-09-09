<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Cart;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::where('company_id', auth()->user()->company_id)->with('images')->get();
        
        return response()->json($products);
    }

    public function store(Request $request) 
    {
        $authUser = auth()->user();

        $request->merge([
            'price' => str_replace(',', '.', $request->price)
        ]);

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->where(function ($query) use ($authUser) {
                    return $query->where('company_id', $authUser->company_id);
                })
            ],
            'description'             => 'nullable|string',
            'price'                   => 'required|numeric|min:0',
            'stock_quantity'          => 'required|integer|min:0',
            'images.*'                => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ], [
            'name.required'           => 'O campo nome é obrigatório.',
            'name.unique'             => 'Já existe um produto com este nome.',
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
        $authUser = auth()->user();

        $request->merge([
            'price' => str_replace(',', '.', $request->price)
        ]);
        
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->ignore($product->id)->where(function ($query) use ($authUser) {
                    return $query->where('company_id', $authUser->company_id);
                }),
            ],
            'description'     => 'nullable|string',
            'price'           => 'required|numeric|min:0',
            'stock_quantity'  => 'required|integer|min:0',
            'images.*'        => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'existing_images' => 'nullable|array' 
        ], [
            'name.required'            => 'O campo nome é obrigatório.',
            'name.unique'              => 'Já existe um produto com este nome.',
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

        $imagesToDelete = $product->images()
            ->whereNotIn('image_path', $existingImages)
            ->get();

        foreach ($imagesToDelete as $img) {
            Storage::disk('public')->delete($img->image_path);
            $img->delete();
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $product->images()->create([
                    'image_path' => $path
                ]);
            }
        }

        return response()->json($product->load('images'), 200);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        
        return response()->json(['message' => 'Produto removido']);
    }

    public function addCart(Request $request)
    {
        $authUser = auth()->user();

        $request->validate([
            'products'            => 'required|array|min:1',
            'products.*.id'       => 'required|integer|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1'
        ]);

        $cartQuery = Cart::query();
        if ($authUser->role === 'client') {
            $cartQuery->where('user_id', $authUser->id);
        } else {
            $cartQuery->where('company_id', $authUser->company_id);
        }

        $cart = $cartQuery->first();

        if (!$cart) {
            $cart = Cart::create([
                'user_id'    => $authUser->role === 'client' ? $authUser->id : null,
                'company_id' => $authUser->role !== 'client' ? $authUser->company_id : null,
            ]);
        }

        $existingCompanyId = $cart->items()->exists() ? $cart->items()->first()->product->company_id : null;

        $cartItemsData = [];

        foreach ($request->products as $p) {
            $product = Product::find($p['id']);

            if (!$product) {
                return response()->json([
                    'message' => "Produto ID {$p['id']} não encontrado"
                ], 404);
            }

            if ($product->stock_quantity < $p['quantity']) {
                return response()->json([
                    'message' => "Produto {$product->name} não possui estoque suficiente"
                ], 422);
            }

            $cartItemsData[] = [
                'product'  => $product,
                'quantity' => $p['quantity'],
                'price'    => $product->price
            ];
        }

        if ($authUser->role === 'client' && $existingCompanyId) {
            $newCompanyId = $cartItemsData[0]['product']->company_id;
            if ($existingCompanyId !== $newCompanyId) {
                $cart->items()->delete(); 
            }
        }

        foreach ($cartItemsData as $item) {
            $cartItem = $cart->items()->where('product_id', $item['product']->id)->first();

            if ($cartItem) {
                $newQty = $cartItem->quantity + $item['quantity'];
                if ($item['product']->stock_quantity < $newQty) {
                    return response()->json([
                        'message' => "Produto {$item['product']->name} não possui estoque suficiente"
                    ], 422);
                }
                $cartItem->update(['quantity' => $newQty]);
            } else {
                $cart->items()->create([
                    'product_id' => $item['product']->id,
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price']
                ]);
            }
        }

        return response()->json([
            'message' => 'Produtos adicionados ao carrinho com sucesso',
            'cart'    => $cart->load('items.product')
        ]);
    }
}
