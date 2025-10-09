"use client";

import React from "react";
import { useCachePersistence, useCacheWarming, useBackgroundSync } from "@/hooks/use-cache-persistence";
import { usePerformanceMonitoring } from "@/hooks/use-performance-monitoring";

export default function CacheManager() {
    useCachePersistence();
    useCacheWarming();
    useBackgroundSync();

    // Monitor performance in development
    const metrics = usePerformanceMonitoring();

    // Log metrics to console for development debugging
    React.useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            const interval = setInterval(() => {
                console.log("📊 Current Performance Metrics:", metrics);
            }, 10000); // Log every 10 seconds

            return () => clearInterval(interval);
        }
    }, [metrics]);

    return null; // This component doesn't render anything
}
