import React from 'react';
import { motion } from 'framer-motion';

export function HeroGraphic() {
    // Define nodes and edges for the network graph
    const nodes = [
        { id: '1', cx: 400, cy: 300, r: 45, label: 'Thesis', color: '#06b6d4', delay: 0 }, // Center
        { id: '2', cx: 200, cy: 150, r: 35, label: 'Data Input', color: '#10b981', delay: 0.2 }, // Top Left
        { id: '3', cx: 600, cy: 150, r: 35, label: 'Enrichment', color: '#6366f1', delay: 0.4 }, // Top Right
        { id: '4', cx: 200, cy: 450, r: 30, label: 'Filter', color: '#8b5cf6', delay: 0.3 }, // Bottom Left
        { id: '5', cx: 600, cy: 450, r: 35, label: 'Signals', color: '#f59e0b', delay: 0.5 }, // Bottom Right
        { id: '6', cx: 100, cy: 300, r: 25, label: 'Web', color: '#64748b', delay: 0.6 }, // Far Left
        { id: '7', cx: 700, cy: 300, r: 25, label: 'Action', color: '#ef4444', delay: 0.7 }, // Far Right
    ];

    const edges = [
        { source: 1, target: 0 }, // Data to Thesis
        { source: 2, target: 0 }, // Enrichment to Thesis
        { source: 3, target: 0 }, // Filter to Thesis
        { source: 4, target: 0 }, // Signals to Thesis
        { source: 5, target: 1 }, // Web to Data
        { source: 2, target: 6 }, // Enrichment to Action
        { source: 4, target: 6 }, // Signals to Action
    ];

    const drawVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (custom: number) => ({
            pathLength: 1,
            opacity: 0.3,
            transition: {
                pathLength: { delay: custom, type: 'spring', duration: 2, bounce: 0 },
                opacity: { delay: custom, duration: 0.5 },
            },
        }),
    };

    const nodeVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: (custom: number) => ({
            scale: 1,
            opacity: 1,
            transition: { delay: custom + 1, type: 'spring', duration: 1, bounce: 0.4 },
        }),
    };

    const pulseVariants = {
        initial: { opacity: 0, scale: 0.8 },
        animate: {
            opacity: [0, 0.5, 0],
            scale: [0.8, 1.5, 0.8],
            transition: {
                duration: 3,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
            <svg
                className="w-full h-full max-w-[1200px] opacity-80"
                viewBox="0 0 800 600"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </radialGradient>
                    <filter id="blur-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" />
                    </filter>
                </defs>

                {/* Ambient Glow */}
                <circle cx="400" cy="300" r="250" fill="url(#glow)" className="animate-pulse-slow" />

                {/* Edges */}
                {edges.map((edge, i) => {
                    const start = nodes[edge.source];
                    const end = nodes[edge.target];
                    return (
                        <motion.line
                            key={`edge-${i}`}
                            x1={start.cx}
                            y1={start.cy}
                            x2={end.cx}
                            y2={end.cy}
                            stroke="url(#gradient-line)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            custom={0.5 + i * 0.2}
                            variants={drawVariants}
                            initial="hidden"
                            animate="visible"
                        />
                    );
                })}

                <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#475569" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Data Pulses along Edges */}
                {edges.map((edge, i) => {
                    const start = nodes[edge.source];
                    const end = nodes[edge.target];
                    return (
                        <motion.circle
                            key={`pulse-${i}`}
                            r="3"
                            fill="#fff"
                            filter="url(#blur-filter)"
                            initial={{ cx: start.cx, cy: start.cy, opacity: 0 }}
                            animate={{
                                cx: [start.cx, end.cx],
                                cy: [start.cy, end.cy],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'linear',
                            }}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <motion.g
                        key={`node-${node.id}`}
                        custom={node.delay}
                        variants={nodeVariants}
                        initial="hidden"
                        animate="visible"
                        className="hero-node origin-center"
                        style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                    >
                        {/* Outer animated ring */}
                        <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r + 12}
                            fill="none"
                            stroke={node.color}
                            strokeWidth="1"
                            opacity="0.2"
                            variants={pulseVariants as any}
                            initial="initial"
                            animate="animate"
                        />

                        {/* Inner background */}
                        <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r}
                            fill="#0f172a"
                            stroke={node.color}
                            strokeWidth="2"
                            className="drop-shadow-xl"
                        />

                        {/* Icon placeholder/glow */}
                        <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r - 8}
                            fill={node.color}
                            opacity="0.15"
                        />

                        {/* Label texts */}
                        <text
                            x={node.cx}
                            y={node.cy + 4}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize={node.r > 30 ? "14" : "11"}
                            fontWeight="600"
                            className="font-sans tracking-wide"
                        >
                            {node.label}
                        </text>
                    </motion.g>
                ))}
            </svg>
        </div>
    );
}
