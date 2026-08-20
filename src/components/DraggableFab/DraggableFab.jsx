import { useCallback, useRef, useState } from "react";
import Draggable from "react-draggable";
import "./DraggableFab.css";

/**
 * Generic draggable floating button. Wraps ANY floating icon/button —
 * the theme switcher, a chat widget, anything — with drag-to-reposition,
 * remembers where it was dropped (per `storageId`, so multiple draggable
 * buttons on the same page each keep their own position), and clamps
 * dragging to the viewport so it can never be dropped off-screen.
 *
 * Uses react-draggable for the actual pointer/touch handling instead of
 * hand-rolling it — battle-tested, handles touch devices, and this is
 * exactly the kind of interaction it's built for.
 *
 * Props:
 *  - storageId: string — unique key, e.g. "theme-fab" / "chat-fab"
 *  - defaultCorner: "bottom-right" | "bottom-left" | "top-right" | "top-left"
 *  - onTap: () => void — fires on a genuine click/tap, never after a drag
 *  - children: the button's visual content
 *  - className: extra class(es) for the button element itself
 *
 * Usage (chat widget):
 *   <DraggableFab storageId="chat-fab" defaultCorner="bottom-left" onTap={() => setChatOpen(true)}>
 *     <FiMessageCircle />
 *   </DraggableFab>
 */
export default function DraggableFab({
  storageId,
  defaultCorner = "bottom-right",
  onTap,
  children,
  className = "",
}) {
  const storageKey = `app-fab-position:${storageId}`;
  const nodeRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const [position, setPosition] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  const handleStart = useCallback((e, data) => {
    dragStartRef.current = { x: data.x, y: data.y };
    didDragRef.current = false;
  }, []);

  // A "drag" only counts once the pointer has moved a few px — anything
  // smaller than that is just a slightly-wobbly click, not a drag.
  const handleDrag = useCallback((e, data) => {
    const dx = Math.abs(data.x - dragStartRef.current.x);
    const dy = Math.abs(data.y - dragStartRef.current.y);
    if (dx > 4 || dy > 4) didDragRef.current = true;
  }, []);

  const handleStop = useCallback(
    (e, data) => {
      setPosition({ x: data.x, y: data.y });
      try {
        localStorage.setItem(storageKey, JSON.stringify({ x: data.x, y: data.y }));
      } catch {
        // localStorage unavailable — position just won't persist this session.
      }
      if (!didDragRef.current && onTap) onTap();
    },
    [onTap, storageKey]
  );

  return (
    <div className={`fab-drag-layer fab-corner-${defaultCorner}`}>
      <Draggable
        nodeRef={nodeRef}
        position={position}
        bounds="parent"
        onStart={handleStart}
        onDrag={handleDrag}
        onStop={handleStop}
      >
        <div ref={nodeRef} className={`fab-drag-handle ${className}`}>
          {children}
        </div>
      </Draggable>
    </div>
  );
}
