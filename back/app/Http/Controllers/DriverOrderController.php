<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;

class DriverOrderController extends Controller
{
    public function index()
    {
        $authUser = auth()->user();

        $orders = Order::with(['items.product.images', 'user'])
            ->where(function ($query) use ($authUser) {
                $query->where(function ($q) use ($authUser) {
                    $q->where('status', 'ready_for_pickup')
                    ->where('store_id', $authUser->company_id)
                    ->whereNull('driver_id');
                })->orWhere(function ($q) use ($authUser) {
                    $q->whereIn('status', ['accepted', 'on_the_way'])
                    ->where('driver_id', $authUser->id);
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $authUser = auth()->user();

        if ($order->store_id !== $authUser->company_id) {
            return response()->json(['error' => 'Este pedido não pertence à sua loja.'], 403);
        }

        $request->validate([
            'status' => 'required|in:on_the_way,delivered'
        ]);

        $order->status = $request->status;
        $order->save();

        return response()->json(['message' => 'Status do pedido atualizado com sucesso.']);
    }

    public function acceptOrder(Request $request, Order $order)
    {
        $authUser = auth()->user();

        if ($order->status !== 'ready_for_pickup' || $order->driver_id !== null) {
            return response()->json(['error' => 'Pedido já aceito ou não disponível.'], 409);
        }

        $order->driver_id = $authUser->id;
        $order->status = 'accepted';
        $order->save();

        return response()->json(['message' => 'Pedido aceito com sucesso.']);
    }
}
