"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ClockIconHandle {
    startAnimation: () => void;
    stopAnimation: () => void;
}

interface ClockIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    size?: number;
}

const handTransition: Transition = {
    duration: 2.0,
    ease: [0.4, 0, 0.2, 1],
    repeat: Infinity,
    repeatDelay: 3,
};

const handVariants: Variants = {
    normal: {
        rotate: 0,
        originX: "0%",
        originY: "100%",
    },
    animate: {
        rotate: 360,
        originX: "0%",
        originY: "100%",
    },
};

const minuteHandTransition: Transition = {
    duration: 1.5,
    ease: "easeInOut",
    repeat: Infinity,
    repeatDelay: 3,
};

const minuteHandVariants: Variants = {
    normal: {
        rotate: 0,
        originX: "0%",
        originY: "100%",
    },
    animate: {
        rotate: 180,
        originX: "0%",
        originY: "100%",
    },
};

const ClockIcon = forwardRef<ClockIconHandle, ClockIconProps>(
    ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
        const controls = useAnimation();
        const reduced = useReducedMotion();
        const isControlledRef = useRef(false);

        // Add useEffect to auto-animate when mounted
        useEffect(() => {
            if (!isControlledRef.current && !reduced) {
                controls.start("animate");
            }
        }, [controls, reduced]);

        useImperativeHandle(ref, () => {
            isControlledRef.current = true;

            return {
                startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")),
                stopAnimation: () => controls.start("normal"),
            };
        });

        const handleMouseEnter = useCallback(
            (e: React.MouseEvent<HTMLButtonElement>) => {
                if (reduced) return;
                if (!isControlledRef.current) {
                    controls.start("animate");
                } else {
                    onMouseEnter?.(e);
                }
            },
            [controls, reduced, onMouseEnter]
        );

        const handleMouseLeave = useCallback(
            (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isControlledRef.current) {
                    controls.start("normal");
                } else {
                    onMouseLeave?.(e);
                }
            },
            [controls, onMouseLeave]
        );

        return (
            <button
                type="button"
                className={cn("border-0 bg-transparent p-0", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Clock Icon"
                >
                    <title>Clock Icon</title>
                    <circle cx="12" cy="12" r="10" />
                    <motion.line
                        x1="12"
                        y1="12"
                        x2="12"
                        y2="6"
                        variants={handVariants}
                        animate={controls}
                        initial="normal"
                        transition={handTransition}
                    />
                    <motion.line
                        x1="12"
                        y1="12"
                        x2="16"
                        y2="12"
                        variants={minuteHandVariants}
                        animate={controls}
                        initial="normal"
                        transition={minuteHandTransition}
                    />
                </svg>
            </button>
        );
    }
);

ClockIcon.displayName = "ClockIcon";

export { ClockIcon };
