<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('legal_name')->nullable();
            $table->string('final_name')->nullable();
            $table->string('cnpj')->unique();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('plan')->nullable();
            $table->boolean('active')->default(true);
            $table->string('email')->nullable();
            $table->string('category')->nullable();
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->string('logo')->nullable();
            $table->decimal('delivery_fee', 8, 2)->nullable();
            $table->integer('delivery_radius')->nullable();
            $table->json('opening_hours')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
