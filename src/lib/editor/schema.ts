export type AdElementBase = {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
};

export type AdTextElement = AdElementBase & {
  type: 'text';
  content: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
};

export type AdPriceElement = AdElementBase & {
  type: 'price';
  style: 'shopee_promo' | 'sale_red' | 'minimal' | string;
  content: {
    price: string;
    oldPrice?: string;
    discount?: string;
    currency?: string;
    leftMain?: string;
    leftSub?: string;
    topRight?: string;
    bottom?: string;
  };
};

export type AdBadgeElement = AdElementBase & {
  type: 'badge';
  style: 'red' | 'yellow' | 'black';
  content: string;
};

export type AdShapeElement = AdElementBase & {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
};

export type AdElement = AdTextElement | AdPriceElement | AdBadgeElement | AdShapeElement;

export type AdvertisementDesignSchema = {
  version: '1.0';
  canvas: {
    width: number;
    height: number;
  };
  background?: {
    type: 'image' | 'color';
    value: string; // URL or hex
  };
  elements: AdElement[];
};
