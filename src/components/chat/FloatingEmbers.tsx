"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Ember {
    id: number;
    x: number;       // % from left
    size: number;    // px
    duration: number; // float cycle seconds
    delay: number;   // animation delay
    opacity: number;
    blurPx: number;
}

function generateEmbers(count: number): Ember[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        size: 3 + Math.random() * 10,
        duration: 6 + Math.random() * 10,
        delay: Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.45,
        blurPx: 1 + Math.random() * 4,
    }));
}

export function FloatingEmbers({ count = 18 }: { count?: number }) {
    const [embers, setEmbers] = useState<Ember[]>([]);

    // Generate on client only to avoid SSR mismatch
    useEffect(() => {
        setEmbers(generateEmbers(count));
    }, [count]);

    if (embers.length === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {embers.map((ember) => (
                <motion.div
                    key={ember.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${ember.x}%`,
                        bottom: '-12px',
                        width: ember.size,
                        height: ember.size,
                        background: `radial-gradient(circle, #FCD34D, #F59E0B)`,
                        boxShadow: `0 0 ${ember.blurPx * 3}px ${ember.blurPx}px rgba(245, 158, 11, 0.6)`,
                        filter: `blur(${ember.blurPx * 0.5}px)`,
                        opacity: 0,
                    }}
                    animate={{
                        y: [0, -(280 + Math.random() * 220)],
                        x: [0, (Math.random() - 0.5) * 80],
                        opacity: [0, ember.opacity, ember.opacity * 0.6, 0],
                        scale: [0.4, 1, 0.8, 0.3],
                    }}
                    transition={{
                        duration: ember.duration,
                        delay: ember.delay,
                        repeat: Infinity,
                        ease: 'easeOut',
                        repeatDelay: Math.random() * 4,
                    }}
                />
            ))}
        </div>
    );
}
