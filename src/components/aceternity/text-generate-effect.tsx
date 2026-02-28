"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.5,
}: {
    words: string;
    className?: string;
    filter?: boolean;
    duration?: number;
}) => {
    const [scope, animate] = useAnimate();
    const wordsArray = words.split(" ");

    useEffect(() => {
        // Ensure animation explicitly runs even if scope ref doesn't trigger standard React effects
        const runAnimation = async () => {
            try {
                await animate(
                    "span",
                    {
                        opacity: 1,
                        filter: filter ? "blur(0px)" : "none",
                    },
                    {
                        duration: duration ? duration : 1,
                        delay: stagger(0.1),
                    }
                );
            } catch {
                // Animation might fail if unmounted, ignore safely.
            }
        };

        runAnimation();
    }, [animate, duration, filter]);

    const renderWords = () => {
        return (
            <motion.div ref={scope}>
                {wordsArray.map((word, idx) => {
                    return (
                        <motion.span
                            key={word + idx}
                            className="text-foreground/90 opacity-0"
                            style={{
                                filter: filter ? "blur(10px)" : "none",
                            }}
                        >
                            {word}{" "}
                        </motion.span>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={cn("font-bold", className)}>
            <div className="mt-4">
                <div className="text-foreground/90 text-2xl leading-snug tracking-wide">
                    {renderWords()}
                </div>
            </div>
        </div>
    );
};
