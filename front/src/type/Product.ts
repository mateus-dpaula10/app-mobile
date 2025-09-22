export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    category?: string; 
    status: 'ativo' | 'em_falta' | 'oculto'; 
    free_shipping: boolean; 
    first_purchase_discount_store: boolean; 
    first_purchase_discount_app: boolean; 
    weighable: boolean; 
    variations: {
        id?: number;
        type: string; 
        value: string; 
    }[];
    images: {
        id: number;
        image_path: string;
    }[];
}