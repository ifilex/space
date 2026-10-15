/**
 * Space Invaders: Neon Assault 90s - Transparent Touch Virtual Joystick & Controls
 * Activates seamlessly on touch/mobile/tablet devices.
 */

import React, { useEffect, useRef, useState } from 'react';

interface TouchControlsProps {
  onMove: (x: number, y: number) => void;
  onFire: () => void;
  onEmp: () => void;
  onPause: () => void;
  empCount: number;
  modeSetting: 'auto' | 'always' | 'never';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onFire,
  onEmp,
  onPause,
  empCount,
  modeSetting,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const fireIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(hasTouch);
  }, []);

  const shouldRender =
    modeSetting === 'always' || (modeSetting === 'auto' && isTouchDevice);

  if (!shouldRender) return null;

  // Joystick handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsDragging(false);
        setStickPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });

    // Normalize -1 to 1 with deadzone
    const normX = dx / maxRadius;
    const normY = dy / maxRadius;
    const deadzone = 0.12;

    const finalX = Math.abs(normX) < deadzone ? 0 : normX;
    const finalY = Math.abs(normY) < deadzone ? 0 : normY;

    onMove(finalX, finalY);
  };

  // Continuous auto-fire while holding fire button
  const startFiring = () => {
    onFire();
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);
    fireIntervalRef.current = window.setInterval(() => {
      onFire();
    }, 120);
  };

  const stopFiring = () => {
    if (fireIntervalRef.current) {
      clearInterval(fireIntervalRef.current);
      fireIntervalRef.current = null;
    }
  };

  return (
    <div
      id="touch-controls-overlay"
      className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-4 pb-8 select-none"
    >
      {/* Left side: Transparent Joystick */}
      <div className="pointer-events-auto flex flex-col items-center">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative w-32 h-32 rounded-full border-2 border-cyan-500/30 bg-cyan-950/20 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-cyan-500/10 active:border-cyan-400/60"
        >
          {/* Outer crosshair guidelines */}
          <div className="absolute w-full h-[1px] bg-cyan-500/15" />
          <div className="absolute h-full w-[1px] bg-cyan-500/15" />

          {/* Stick Knob */}
          <div
            className={`w-14 h-14 rounded-full border-2 border-cyan-400/70 bg-gradient-to-b from-cyan-400/40 to-blue-600/50 shadow-md shadow-cyan-400/30 transition-transform ${
              isDragging ? 'scale-110 border-cyan-300' : ''
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          />
        </div>
        <span className="text-[10px] text-cyan-400/50 font-pixel mt-1 tracking-wider uppercase">
          JoyStick
        </span>
      </div>

      {/* Right side: Fire & EMP buttons */}
      <div className="pointer-events-auto flex items-end gap-3">
        {/* EMP Special Bomb button */}
        <button
          id="btn-touch-emp"
          onTouchStart={(e) => {
            e.preventDefault();
            onEmp();
          }}
          disabled={empCount <= 0}
          className={`relative w-16 h-16 rounded-full border-2 border-purple-500/50 bg-purple-950/30 backdrop-blur-xs flex flex-col items-center justify-center active:scale-95 transition-transform ${
            empCount > 0
              ? 'shadow-lg shadow-purple-500/30 border-purple-400/70 text-purple-200'
              : 'opacity-40 border-gray-600/30 text-gray-500'
          }`}
        >
          <span className="text-lg">💣</span>
          <span className="text-[9px] font-pixel text-purple-300">
            EMP ({empCount})
          </span>
        </button>

        {/* Primary Laser Fire Button */}
        <button
          id="btn-touch-fire"
          onTouchStart={(e) => {
            e.preventDefault();
            startFiring();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopFiring();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            stopFiring();
          }}
          className="w-22 h-22 rounded-full border-2 border-cyan-400/70 bg-gradient-to-b from-cyan-500/30 to-blue-700/40 backdrop-blur-xs flex flex-col items-center justify-center active:scale-95 shadow-xl shadow-cyan-500/30 text-cyan-100 transition-all active:border-cyan-300"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-[10px] font-pixel tracking-wider text-cyan-200 mt-0.5">
            FUEGO
          </span>
        </button>
      </div>

      {/* Top right quick pause button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          id="btn-touch-pause"
          onClick={onPause}
          className="p-2.5 rounded-lg border border-cyan-500/30 bg-black/40 text-cyan-300 text-xs font-pixel backdrop-blur-xs"
        >
          ⏸ PAUSA
        </button>
      </div>
    </div>
  );
};
