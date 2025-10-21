<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Carbon\Carbon;

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

    public function generatePixCode(string $id)
    {
        $user = auth()->user();
        $order = Order::findOrFail($id);

        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'Acesso negado'], 403);
        }

        $pixKey = $order->store->pix_key;
        if (!$pixKey) {
            return response()->json(['message' => 'Loja não possui chave PIX cadastrada'], 400);
        }

        $amount = number_format($order->total, 2, '.', '');
        $merchantName = mb_substr($order->store->final_name, 0, 25);
        $fullAddress = $order->store->address;
        $parts = explode(',', $fullAddress);
        $cep = trim(array_pop($parts));
        $cityState = trim(array_pop($parts));
        $stateParts = explode('-', $cityState);
        $state = strtoupper(trim(end($stateParts)));
        $street = implode(',', $parts);
        $addressField = strtoupper($fullAddress);

        $buildPixField = function ($id, $value) {
            $len = strlen($value);
            return $id . str_pad($len, 2, '0', STR_PAD_LEFT) . $value;
        };

        $merchantAccountInfo = 
            $buildPixField('00', 'BR.GOV.BCB.PIX') .
            $buildPixField('01', $pixKey);

        $payload =
            $buildPixField('00', '01') .
            $buildPixField('26', $merchantAccountInfo) .
            $buildPixField('52', '0000') .
            $buildPixField('53', '986') .
            $buildPixField('54', $amount) .
            $buildPixField('58', 'BR') .
            $buildPixField('59', strtoupper($merchantName)) .
            $buildPixField('60', $state) .
            $buildPixField('62', $buildPixField('05', $order->code));

        $crcInput = $payload . '6304';
        $crc = strtoupper(dechex($this->crc16($crcInput)));
        $crc = str_pad($crc, 4, '0', STR_PAD_LEFT);

        $pixCode = $payload . '6304' . $crc;
        $expiresAt = now()->addMinutes(10)->timestamp;

        return response()->json([
            'pix_code'  => $pixCode,
            'expira_em' => $expiresAt
        ]);
    }

    private function crc16($string)
    {
        $poly = 0x1021;
        $crc = 0xFFFF;

        for ($i = 0; $i < strlen($string); $i++) {
            $crc ^= (ord($string[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                if (($crc & 0x8000) != 0) {
                    $crc = ($crc << 1) ^ $poly;
                } else {
                    $crc <<= 1;
                }
                $crc &= 0xFFFF;
            }
        }

        return $crc;
    }
}
