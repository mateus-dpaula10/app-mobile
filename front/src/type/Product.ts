export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    images: { id: number; image_path: string }[]
}