'use client';

/**
 * Shared Framer Motion primitives for the buyer + seller redesign.
 *
 * All of these honour `prefers-reduced-motion`: when the user opts out, content
 * renders in its final state with no transform/opacity animation (the
 * interaction is kept, the motion is dropped — Rules.md §4 / Design.md).
 *
 * Springs use stiffness ~300 / damping ~26 for a lively-but-settled feel.
 */

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

/* -------------------------------------------------------------------------- */
/* Reveal — fade + slide (+ optional scale) in when scrolled into view.       */
/* -------------------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = as;

  // CSS-driven (compositor thread) rather than framer-motion whileInView — under
  // heavy GPU load the JS opacity tween can stall mid-animation and leave content
  // stuck invisible. A CSS keyframe always reaches its final state.
  return (
    <Tag
      className={cn(reduce ? undefined : 'animate-slide-up', className)}
      style={reduce ? undefined : { animationDelay: `${delay}s`, animationDuration: '0.6s' }}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/* Stagger — parent orchestrates a cascade of StaggerItem children.           */
/* -------------------------------------------------------------------------- */
export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  once?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn(reduce ? undefined : 'animate-slide-up', className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SplitText — word-by-word mask reveal for hero headings.                    */
/* -------------------------------------------------------------------------- */
export function SplitText({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  if (reduce) return <span className={className}>{text}</span>;

  return (
    <span className={cn('inline', className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block">
          <motion.span
            className={cn('inline-block', wordClassName)}
            initial={{ opacity: 0, y: '0.35em' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: delay + i * 0.08 }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* TiltCard — pointer-tracked 3D tilt + directional glare. Pointer only.      */
/* -------------------------------------------------------------------------- */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ rx: number; ry: number; gx: number; gy: number }>({
    rx: 0,
    ry: 0,
    gx: 50,
    gy: 50,
  });

  if (reduce) return <div className={className}>{children}</div>;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setStyle({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
    });
  }

  function reset() {
    setStyle({ rx: 0, ry: 0, gx: 50, gy: 50 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn('relative [transform-style:preserve-3d]', className)}
      style={{
        transform: `perspective(900px) rotateX(${style.rx}deg) rotateY(${style.ry}deg)`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [.group:hover_&]:opacity-100"
        style={{
          background: `radial-gradient(220px circle at ${style.gx}% ${style.gy}%, rgb(var(--mn-accent) / 0.18), transparent 60%)`,
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MotionButton — spring press feedback for buttons/links.                    */
/* -------------------------------------------------------------------------- */
export function MotionButton({
  children,
  className,
  ...props
}: HTMLMotionProps<'button'> & { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      className={className}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export { motion };
