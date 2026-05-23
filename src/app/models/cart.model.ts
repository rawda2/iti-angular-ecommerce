export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
