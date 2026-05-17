import { useEffect, useRef, useState } from 'react';

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
}

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const secondaryCursorRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(isTouchDevice);

  // Mouse position and target position for smoothing
  const mousePos = useRef({ x: 0, y: 0 });
  const targetPosPrimary = useRef({ x: 0, y: 0 });
  const targetPosSecondary = useRef({ x: 0, y: 0 });

  // Detect mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(isTouchDevice());
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      // Restore default cursor on mobile
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      return;
    }

    // Hide normal cursor on HTML/Body
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';

    const handleMouseMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    const handleMouseEnterLink = () => setIsHovered(true);
    const handleMouseLeaveLink = () => setIsHovered(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Add listeners for interactive elements
    const updateInteractiveListeners = () => {
      const interactiveElements = document.querySelectorAll('a, button, input, select, [role="button"], .cursor-pointer');
      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', handleMouseEnterLink);
        el.addEventListener('mouseleave', handleMouseLeaveLink);
        // Ensure cursor: none is also applied here so they don't briefly show pointer
        el.style.cursor = 'none';
      });
    };

    updateInteractiveListeners();

    // Watch for changes in the DOM to attach listeners to new dynamic buttons (e.g. popup)
    const observer = new MutationObserver(() => {
      updateInteractiveListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Animation Loop
    let animationFrameId;
    const render = () => {
      // Smooth interpolation (lerp) for the primary star
      targetPosPrimary.current.x += (mousePos.current.x - targetPosPrimary.current.x) * 0.3;
      targetPosPrimary.current.y += (mousePos.current.y - targetPosPrimary.current.y) * 0.3;

      // Slower interpolation for the secondary star glow trail
      targetPosSecondary.current.x += (mousePos.current.x - targetPosSecondary.current.x) * 0.15;
      targetPosSecondary.current.y += (mousePos.current.y - targetPosSecondary.current.y) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${targetPosPrimary.current.x}px, ${targetPosPrimary.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (secondaryCursorRef.current) {
        secondaryCursorRef.current.style.transform = `translate3d(${targetPosSecondary.current.x}px, ${targetPosSecondary.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isMobile]);

  // Don't render anything on mobile
  if (isMobile) return null;

  return (
    <>
      {/* Glow background trail */}
      <div
        ref={secondaryCursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-opacity duration-300 mix-blend-screen"
        style={{
          width: '30px',
          height: '30px',
          opacity: isClicked ? 0.7 : 0.3,
        }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-white blur-[2px]">
          <path
            d="M12,0 Q12,12 0,12 Q12,12 12,24 Q12,12 24,12 Q12,12 12,0 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Main Star Cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[10000] transition-all duration-200 ease-out"
        style={{
          width: isHovered ? '24px' : '16px',
          height: isHovered ? '24px' : '16px',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-full h-full text-white fill-current"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
            transform: `rotate(${isClicked ? '45deg' : '0deg'}) scale(${isClicked ? 0.8 : 1})`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <path d="M12,0 Q12,12 0,12 Q12,12 12,24 Q12,12 24,12 Q12,12 12,0 Z" />
        </svg>
      </div>

      {/* Embedded global CSS to make sure cursor is hidden everywhere */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
}
