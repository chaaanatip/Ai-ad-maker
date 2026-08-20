import * as fabric from 'fabric';
import { AdElement, AdTextElement, AdPriceElement } from './schema';

// Helper to inject custom properties
const withCustomProps = (obj: any, element: AdElement) => {
  obj.set({
    id: element.id,
    layerName: element.id, // For layer panel
    elementType: element.type,
    locked: element.locked || false,
    selectable: !(element.locked || false),
  });
  return obj;
};

export const createFabricText = (el: AdTextElement): fabric.Textbox => {
  const shadow = el.shadow ? new fabric.Shadow({
    color: el.shadow.color,
    blur: el.shadow.blur,
    offsetX: el.shadow.offsetX,
    offsetY: el.shadow.offsetY,
  }) : undefined;

  const text = new fabric.Textbox(el.content, {
    left: el.x,
    top: el.y,
    width: el.width || 300,
    fontFamily: el.fontFamily || 'sans-serif',
    fontSize: el.fontSize || 40,
    fontWeight: el.fontWeight as number | string || 'normal',
    fill: el.color || '#000000',
    textAlign: el.textAlign || 'left',
    angle: el.rotation || 0,
    shadow,
  });

  return withCustomProps(text, el);
};

export const createFabricPriceFrame = (el: AdPriceElement): fabric.Group => {
  // We'll build a simplified Shopee Promo frame for the adapter
  const width = el.width || 400;
  const height = el.height || 130;
  
  // Base polygon (main purple arrow)
  const bgPolygon = new fabric.Polygon([
    { x: 80, y: 35 },
    { x: width, y: 35 },
    { x: width, y: height - 15 },
    { x: 60, y: height - 15 },
    { x: 30, y: 75 },
  ], {
    fill: '#31007A',
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.4)', blur: 6, offsetX: 2, offsetY: 4 })
  });

  // Price text
  const priceText = new fabric.Textbox(el.content.price, {
    left: width - 20,
    top: 40,
    fontSize: 75,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 900,
    fontStyle: 'italic',
    fill: '#FFFFFF',
    originX: 'right', // acts like textAnchor="end"
    stroke: 'rgba(255,255,255,0.2)',
    strokeWidth: 2,
    width: 250,
    textAlign: 'right'
  });

  // Left Info Text
  const leftTextMain = new fabric.Textbox(el.content.leftMain || '', {
    left: 45,
    top: 65,
    fontSize: 18,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: 900,
    fill: '#FFFFFF',
    width: 150,
  });

  const group = new fabric.Group([bgPolygon, priceText, leftTextMain], {
    left: el.x,
    top: el.y,
    angle: el.rotation || 0,
  });

  return withCustomProps(group, el);
};

export const renderSchemaToCanvas = (canvas: fabric.Canvas, elements: AdElement[]) => {
  elements.forEach((el) => {
    let fabricObj: fabric.Object | null = null;

    if (el.type === 'text') {
      fabricObj = createFabricText(el as AdTextElement);
    } else if (el.type === 'price') {
      fabricObj = createFabricPriceFrame(el as AdPriceElement);
    }

    if (fabricObj) {
      canvas.add(fabricObj);
    }
  });

  canvas.renderAll();
};
