import { useState, useRef, useCallback, useEffect } from "react";

interface Position {
  x: number; // percentage (0-1)
  y: number; // percentage (0-1)
}

export function useDraggable(
  initialPosition: Position,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

  // Sync initialPosition if it changes from props, but only if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setPosition(initialPosition);
    }
  }, [initialPosition.x, initialPosition.y]); // Check deep values

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startPosRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    
    // Capture pointer to handle movements outside the element
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !startPosRef.current || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startPosRef.current.clientX;
    const deltaY = e.clientY - startPosRef.current.clientY;

    // Convert pixel delta to percentage delta
    const deltaXPct = deltaX / containerRect.width;
    const deltaYPct = deltaY / containerRect.height;

    // Calculate new position
    let newX = startPosRef.current.startX + deltaXPct;
    let newY = startPosRef.current.startY + deltaYPct;

    // Clamp between 0 and 1
    newX = Math.max(0, Math.min(1, newX));
    newY = Math.max(0, Math.min(1, newY));

    setPosition({ x: newX, y: newY });
  }, [isDragging, containerRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    startPosRef.current = null;
    
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  return {
    position,
    isDragging,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    }
  };
}
