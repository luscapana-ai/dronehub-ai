
import React, { useState, useEffect } from 'react';
import { Activity, Battery, Signal, Wind, Zap } from '../../components/Icons';

export const HUDOverlay: React.FC = () => {
    const [telemetry, setTelemetry] = useState({
        alt: 124.5,
        dist: 450,
        batt: 22.4,
        amps: 12.5,
        signal: 98,
        speed: 45
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTelemetry(prev => ({
                alt: prev.alt + (Math.random() - 0.5),
                dist: prev.dist + (Math.random() * 2),
                batt: Math.max(0, prev.batt - 0.001),
                amps: 10 + Math.random() * 15,
                signal: 95 + Math.random() * 5,
                speed: 40 + Math.random() * 10
            }));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none font-mono text-[10px] text-white/80 p-10 flex flex-col justify-between overflow-hidden">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="flex items-center gap-2 drop-shadow-lg"><Activity className="w-3 h-3 text-cyan-400"/> LINK: {telemetry.signal}%</p>
                    <p className="flex items-center gap-2 drop-shadow-lg"><Wind className="w-3 h-3 text-emerald-400"/> WIND: 12km/h</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold drop-shadow-lg">{new Date().toLocaleTimeString()}</p>
                    <p className="text-cyan-400 drop-shadow-lg">GPS: 14 SAT</p>
                </div>
            </div>

            {/* Artificial Horizon (CSS Simulation) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-40">
                <div className="absolute top-1/2 left-0 w-10 h-0.5 bg-white"></div>
                <div className="absolute top-1/2 right-0 w-10 h-0.5 bg-white"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white"></div>
                {/* Dynamic pitch lines could be added here */}
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="bg-black/40 px-3 py-1 rounded border border-white/10 backdrop-blur-sm">
                        <p className="flex items-center gap-2"><Battery className="w-3 h-3 text-amber-400"/> {telemetry.batt.toFixed(1)}V</p>
                        <p className="text-[8px] text-gray-400 ml-5">{telemetry.amps.toFixed(1)}A</p>
                    </div>
                    <p className="drop-shadow-lg">RSSI: -45dbm</p>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="w-1 h-20 bg-white/20 relative">
                        <div className="absolute left-[-4px] w-8 h-0.5 bg-cyan-500 shadow-[0_0_10px_cyan]" style={{ bottom: `${(telemetry.alt/300)*100}%` }}></div>
                    </div>
                    <p className="mt-2 font-bold">{telemetry.alt.toFixed(0)}m ALT</p>
                </div>

                <div className="text-right space-y-2">
                    <div className="bg-black/40 px-3 py-1 rounded border border-white/10 backdrop-blur-sm">
                         <p className="font-bold">{telemetry.speed.toFixed(0)} KM/H</p>
                         <p className="text-[8px] text-gray-400">GROUND SPEED</p>
                    </div>
                    <p className="drop-shadow-lg">DIST: {telemetry.dist.toFixed(0)}m</p>
                </div>
            </div>
            
            {/* OSD Decorative corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/30"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/30"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/30"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/30"></div>
        </div>
    );
};
