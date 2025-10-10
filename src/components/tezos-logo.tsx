"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface TezosLogoHandle {
    startAnimation: () => void;
    stopAnimation: () => void;
}

interface TezosLogoProps extends HTMLAttributes<HTMLDivElement> {
    size?: number;
    variant?: "animated" | "static";
    filled?: boolean;
}

const pathTransition: Transition = {
    duration: 2.0,
    ease: [0.4, 0, 0.2, 1],
    repeat: Infinity,
    repeatDelay: 2.5,
};

const pathVariants: Variants = {
    normal: {
        pathLength: 1,
        pathOffset: 0,
        opacity: 1,
    },
    animate: {
        pathLength: [0, 1],
        pathOffset: [0, 0],
        opacity: [0.3, 1],
    },
};

const TezosLogo = forwardRef<TezosLogoHandle, TezosLogoProps>(
    ({ onMouseEnter, onMouseLeave, className, size = 28, variant = "animated", filled = false, ...props }, ref) => {
        const controls = useAnimation();
        const reduced = useReducedMotion();
        const isControlledRef = useRef(false);

        // Auto-animate when mounted (only for animated variant)
        useEffect(() => {
            if (variant === "static") return;
            if (!isControlledRef.current && !reduced) {
                controls.start("animate");
            }
        }, [controls, reduced, variant]);

        useImperativeHandle(ref, () => {
            isControlledRef.current = true;

            return {
                startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")),
                stopAnimation: () => controls.start("normal"),
            };
        });

        const handleMouseEnter = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (reduced || variant === "static") return;
                if (!isControlledRef.current) {
                    controls.start("animate");
                } else {
                    onMouseEnter?.(e);
                }
            },
            [controls, reduced, onMouseEnter, variant]
        );

        const handleMouseLeave = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (variant === "static") return;
                if (!isControlledRef.current) {
                    controls.start("normal");
                } else {
                    onMouseLeave?.(e);
                }
            },
            [controls, onMouseLeave, variant]
        );

        // For static variant, return a simpler component
        if (variant === "static") {
            return (
                <div className={cn("inline-flex items-center justify-center", className)} {...props}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={size}
                        height={size}
                        viewBox="0 0 11 13"
                        fill={filled ? "currentColor" : "none"}
                        aria-label="Tezos Logo"
                    >
                        <title>Tezos Logo</title>
                        <path
                            d="M3.88 8.181C4.088 8.181 4.283 8.168 4.465 8.142C4.647 8.10733 4.82033 8.06833 4.985 8.025V8.909C4.82033 8.96967 4.621 9.02167 4.387 9.065C4.16167 9.10833 3.91467 9.13 3.646 9.13C3.23867 9.13 2.88767 9.06067 2.593 8.922C2.29833 8.77467 2.073 8.545 1.917 8.233C1.76967 7.91233 1.696 7.492 1.696 6.972V2.929H0.708V2.383L1.748 1.954L2.164 0.42H2.84V2.019H4.855V2.929H2.84V6.92C2.84 7.34467 2.92667 7.661 3.1 7.869C3.282 8.077 3.542 8.181 3.88 8.181ZM10.276 2.019V2.799L7.182 6.062C7.97933 6.09667 8.625 6.23967 9.119 6.491C9.613 6.73367 9.97267 7.06733 10.198 7.492C10.4233 7.91667 10.536 8.41933 10.536 9C10.5447 9.60667 10.4103 10.1483 10.133 10.625C9.86433 11.1017 9.47433 11.47 8.963 11.73C8.45167 11.9987 7.83633 12.1287 7.117 12.12C6.64033 12.12 6.19833 12.081 5.791 12.003C5.38367 11.925 5.00667 11.8123 4.66 11.665V10.612C5.05867 10.8027 5.45733 10.9413 5.856 11.028C6.26333 11.1147 6.662 11.158 7.052 11.158C7.572 11.158 8.001 11.0627 8.339 10.872C8.68567 10.6813 8.94133 10.4213 9.106 10.092C9.27933 9.76267 9.366 9.38567 9.366 8.961C9.366 8.53633 9.27067 8.17667 9.08 7.882C8.898 7.58733 8.60767 7.362 8.209 7.206C7.81033 7.04133 7.28167 6.959 6.623 6.959H5.843V6.101L8.833 2.929H4.855V2.019H10.276Z"
                            stroke={filled ? "none" : "currentColor"}
                            strokeWidth={filled ? "0" : "0.5"}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            );
        }

        return (
            <div className={cn("inline-flex items-center justify-center", className)} {...props}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 11 13"
                    fill="none"
                    aria-label="Tezos Logo"
                >
                    <title>Tezos Logo</title>
                    <motion.path
                        d="M3.88 8.181C4.088 8.181 4.283 8.168 4.465 8.142C4.647 8.10733 4.82033 8.06833 4.985 8.025V8.909C4.82033 8.96967 4.621 9.02167 4.387 9.065C4.16167 9.10833 3.91467 9.13 3.646 9.13C3.23867 9.13 2.88767 9.06067 2.593 8.922C2.29833 8.77467 2.073 8.545 1.917 8.233C1.76967 7.91233 1.696 7.492 1.696 6.972V2.929H0.708V2.383L1.748 1.954L2.164 0.42H2.84V2.019H4.855V2.929H2.84V6.92C2.84 7.34467 2.92667 7.661 3.1 7.869C3.282 8.077 3.542 8.181 3.88 8.181ZM10.276 2.019V2.799L7.182 6.062C7.97933 6.09667 8.625 6.23967 9.119 6.491C9.613 6.73367 9.97267 7.06733 10.198 7.492C10.4233 7.91667 10.536 8.41933 10.536 9C10.5447 9.60667 10.4103 10.1483 10.133 10.625C9.86433 11.1017 9.47433 11.47 8.963 11.73C8.45167 11.9987 7.83633 12.1287 7.117 12.12C6.64033 12.12 6.19833 12.081 5.791 12.003C5.38367 11.925 5.00667 11.8123 4.66 11.665V10.612C5.05867 10.8027 5.45733 10.9413 5.856 11.028C6.26333 11.1147 6.662 11.158 7.052 11.158C7.572 11.158 8.001 11.0627 8.339 10.872C8.68567 10.6813 8.94133 10.4213 9.106 10.092C9.27933 9.76267 9.366 9.38567 9.366 8.961C9.366 8.53633 9.27067 8.17667 9.08 7.882C8.898 7.58733 8.60767 7.362 8.209 7.206C7.81033 7.04133 7.28167 6.959 6.623 6.959H5.843V6.101L8.833 2.929H4.855V2.019H10.276Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        variants={pathVariants}
                        animate={controls}
                        initial="normal"
                        transition={pathTransition}
                    />
                </svg>
            </div>
        );
    }
);

TezosLogo.displayName = "TezosLogo";

export { TezosLogo };
export default TezosLogo;
