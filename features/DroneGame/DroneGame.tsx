
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Gamepad, Key } from '../../components/Icons';

// Game constants
const GRAVITY = 0.4;
const THRUST = -7;
const BASE_OBSTACLE_SPEED = 4;
const OBSTACLE_SPAWN_RATE = 1800; // ms
const GAP_SIZE = 190;

// Sound synthesizer
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playGameSound = (type: 'thrust' | 'score' | 'crash' | 'shield') => {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'thrust') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc.frequency.linearRampToValueAtTime(400, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
};

interface GameStateUI {
    score: number;
    highScore: number;
    isPlaying: boolean;
    gameOver: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Collectible {
    type: 'battery' | 'shield';
    x: number;
    y: number;
    collected: boolean;
}

export const DroneGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // React state for UI overlay only
    const [uiState, setUiState] = useState<GameStateUI>({ score: 0, highScore: 0, isPlaying: false, gameOver: false });

    // Mutable game state (The Source of Truth for the Loop)
    const gameRef = useRef({
        isPlaying: false,
        gameOver: false,
        score: 0,
        highScore: 0,
        speed: BASE_OBSTACLE_SPEED,
        lastSpawnTime: 0,
        hasShield: false
    });

    // Entities
    const drone = useRef({ x: 100, y: 200, velocity: 0, rotation: 0, width: 40, height: 20 });
    const obstacles = useRef<{x: number, topHeight: number, passed: boolean}[]>([]);
    const particles = useRef<Particle[]>([]);
    const collectibles = useRef<Collectible[]>([]);
    
    // Rendering vars
    const requestRef = useRef<number | null>(null);
    const bgOffset = useRef<number>(0);
    const cityOffset = useRef<number>(0);

    const startGame = () => {
        // Reset Logic State
        gameRef.current.isPlaying = true;
        gameRef.current.gameOver = false;
        gameRef.current.score = 0;
        gameRef.current.speed = BASE_OBSTACLE_SPEED;
        gameRef.current.lastSpawnTime = Date.now();
        gameRef.current.hasShield = false;

        // Reset Entities
        drone.current = { x: 100, y: 200, velocity: 0, rotation: 0, width: 40, height: 20 };
        obstacles.current = [];
        particles.current = [];
        collectibles.current = [];
        bgOffset.current = 0;
        cityOffset.current = 0;

        // Sync UI
        setUiState(prev => ({ ...prev, isPlaying: true, gameOver: false, score: 0 }));

        // Start Loop
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        loop();
    };

    const spawnParticles = (x: number, y: number, count: number, type: 'thrust' | 'explosion' | 'shieldBreak') => {
        for (let i = 0; i < count; i++) {
            const angle = type === 'explosion' || type === 'shieldBreak' ? Math.random() * Math.PI * 2 : Math.PI / 2 + (Math.random() - 0.5);
            const speed = type === 'explosion' ? Math.random() * 5 : (type === 'shieldBreak' ? Math.random() * 8 : Math.random() * 2 + 1);
            
            let color = '#cbd5e1'; // Smoke
            if (type === 'explosion') color = Math.random() > 0.5 ? '#facc15' : '#ef4444';
            if (type === 'shieldBreak') color = '#3b82f6'; // Blue

            particles.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + (type === 'thrust' ? 2 : 0),
                life: 1.0,
                maxLife: 1.0,
                color,
                size: type === 'explosion' ? Math.random() * 4 + 2 : Math.random() * 3 + 1
            });
        }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.life -= 0.02;
            p.x += p.vx;
            p.y += p.vy;

            if (p.life <= 0) {
                particles.current.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    };

    const drawDrone = (ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x + 20, y + 10);
        ctx.rotate(rot);

        // Shield Effect
        if (gameRef.current.hasShield) {
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.restore();
        }

        // Arms
        ctx.strokeStyle = '#9ca3af'; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, -10);
        ctx.lineTo(15, 10);
        ctx.moveTo(15, -10);
        ctx.lineTo(-15, 10);
        ctx.stroke();

        // Body
        ctx.fillStyle = '#06b6d4'; 
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Propellers
        const time = Date.now() / 40; 
        ctx.fillStyle = '#e5e7eb'; 
        
        const props = [
            { px: -15, py: -10 },
            { px: 15, py: -10 },
            { px: -15, py: 10 },
            { px: 15, py: 10 }
        ];

        props.forEach(p => {
            ctx.beginPath();
            const width = 2 + Math.abs(Math.sin(time + p.px) * 14); 
            ctx.ellipse(p.px, p.py, width, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // LED Light (Blinking)
        ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(-8, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#020617'); 
        gradient.addColorStop(1, '#1e1b4b'); 
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Parallax City
        ctx.fillStyle = '#1e293b'; 
        const buildingWidth = 60;
        cityOffset.current = (cityOffset.current - 0.5) % buildingWidth;
        
        for (let i = -1; i < (width / buildingWidth) + 1; i++) {
            const h = 50 + Math.abs(Math.sin(i * 132.1)) * 150;
            ctx.fillRect((i * buildingWidth) + cityOffset.current, height - h, buildingWidth + 1, h);
            
            ctx.fillStyle = '#facc15'; 
            if (i % 3 === 0) {
                 ctx.fillRect((i * buildingWidth) + cityOffset.current + 10, height - h + 10, 5, 5);
                 ctx.fillRect((i * buildingWidth) + cityOffset.current + 30, height - h + 20, 5, 5);
            }
            ctx.fillStyle = '#1e293b';
        }

        // Grid Floor
        const horizon = height * 0.85;
        ctx.fillStyle = '#1e1b4b'; 
        ctx.fillRect(0, horizon, width, height - horizon);

        ctx.strokeStyle = '#c026d3'; 
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        
        bgOffset.current = (bgOffset.current - gameRef.current.speed) % 40;
        
        ctx.beginPath();
        for (let x = bgOffset.current; x < width; x += 40) {
            ctx.moveTo(x, horizon);
            const spread = (x - width/2) * 2.5;
            ctx.lineTo(width/2 + spread, height);
        }
        for (let i = 0; i < 8; i++) {
             const y = horizon + (i * i * 3);
             if (y > height) break;
             ctx.moveTo(0, y);
             ctx.lineTo(width, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    };

    const drawGate = (ctx: CanvasRenderingContext2D, x: number, topHeight: number, gap: number, height: number) => {
        const poleColor = '#4b5563'; 
        const neonColor = '#facc15'; 
        const fabricColor = '#fbbf24'; 

        const drawPole = (px: number, py: number, ph: number) => {
             ctx.fillStyle = poleColor;
             ctx.fillRect(px, py, 12, ph);
             // Neon strip
             ctx.shadowBlur = 15;
             ctx.shadowColor = neonColor;
             ctx.fillStyle = neonColor;
             ctx.fillRect(px + 4, py, 4, ph);
             ctx.shadowBlur = 0;
        };

        // Top Gate
        drawPole(x, 0, topHeight);
        
        // Flag
        ctx.fillStyle = fabricColor;
        ctx.beginPath();
        ctx.moveTo(x + 12, topHeight - 30);
        ctx.lineTo(x + 40 + Math.sin(Date.now() / 200) * 5, topHeight - 40); 
        ctx.lineTo(x + 12, topHeight - 50);
        ctx.fill();

        // Bottom Gate
        const bottomY = topHeight + gap;
        drawPole(x, bottomY, height - bottomY);
    };

    const drawCollectible = (ctx: CanvasRenderingContext2D, c: Collectible) => {
        if (c.collected) return;
        const yOffset = Math.sin(Date.now() / 300) * 5; 

        ctx.save();
        ctx.translate(c.x, c.y + yOffset);
        
        if (c.type === 'battery') {
            // Battery Body
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(-10, -15, 20, 30);
            ctx.fillStyle = '#166534'; 
            ctx.strokeRect(-10, -15, 20, 30);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-5, -20, 10, 5);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-2, -5);
            ctx.lineTo(4, 0);
            ctx.lineTo(0, 2);
            ctx.lineTo(2, 8);
            ctx.lineTo(-4, 2);
            ctx.lineTo(0, 0);
            ctx.fill();
        } else if (c.type === 'shield') {
            // Shield Orb
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#3b82f6';
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('S', -4, 4);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    };

    const loop = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const canvas = canvasRef.current;
        
        const state = gameRef.current;

        // --- PHYSICS & LOGIC ---
        
        // Speed scaling
        const difficultyMultiplier = Math.floor(state.score / 5);
        state.speed = BASE_OBSTACLE_SPEED + (difficultyMultiplier * 0.5);

        // Drone Physics
        drone.current.velocity += GRAVITY;
        drone.current.y += drone.current.velocity;
        
        // Rotation
        const targetRot = Math.min(Math.max(drone.current.velocity * 0.05, -0.6), 0.6);
        drone.current.rotation += (targetRot - drone.current.rotation) * 0.1;

        // Floor/Ceiling Collision
        if (drone.current.y + drone.current.height > canvas.height || drone.current.y < 0) {
            handleCrash();
            return; // Stop rendering this frame if crashed
        }

        // Spawning
        const now = Date.now();
        const spawnRate = OBSTACLE_SPAWN_RATE / (state.speed / BASE_OBSTACLE_SPEED); 
        
        if (now - state.lastSpawnTime > spawnRate) {
            const minHeight = 50;
            const maxHeight = canvas.height - GAP_SIZE - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            
            obstacles.current.push({
                x: canvas.width,
                topHeight,
                passed: false
            });

            // Spawning Collectibles (30% chance battery, 10% chance shield)
            const rand = Math.random();
            if (rand > 0.6 && rand < 0.9) {
                collectibles.current.push({
                    type: 'battery',
                    x: canvas.width + 100,
                    y: topHeight + (GAP_SIZE / 2),
                    collected: false
                });
            } else if (rand >= 0.9) {
                collectibles.current.push({
                    type: 'shield',
                    x: canvas.width + 100,
                    y: topHeight + (GAP_SIZE / 2),
                    collected: false
                });
            }

            state.lastSpawnTime = now;
        }

        // Move Objects
        obstacles.current.forEach(obs => obs.x -= state.speed);
        collectibles.current.forEach(c => c.x -= state.speed);
        
        // Cleanup
        obstacles.current = obstacles.current.filter(obs => obs.x + 60 > 0);
        collectibles.current = collectibles.current.filter(c => c.x + 50 > 0);

        // Hitbox
        const hitboxMargin = 10; 
        const d = {
            x: drone.current.x + hitboxMargin,
            y: drone.current.y + hitboxMargin,
            w: drone.current.width - (hitboxMargin * 2),
            h: drone.current.height - (hitboxMargin * 2)
        };

        // Collision: Obstacles
        for (const obs of obstacles.current) {
            const poleWidth = 32; 
            const hasHitTop = d.x < obs.x + poleWidth && d.x + d.w > obs.x && d.y < obs.topHeight;
            const hasHitBottom = d.x < obs.x + poleWidth && d.x + d.w > obs.x && d.y + d.h > obs.topHeight + GAP_SIZE;
            
            if (hasHitTop || hasHitBottom) {
                if (state.hasShield) {
                    state.hasShield = false;
                    spawnParticles(drone.current.x, drone.current.y, 50, 'shieldBreak');
                    playGameSound('crash'); // shield break sound
                    // Push obstacle away or just ignore collision for this frame?
                    // Simplest is to just break shield and continue
                } else {
                    handleCrash();
                    return;
                }
            }
            if (!obs.passed && d.x > obs.x + poleWidth) {
                obs.passed = true;
                state.score += 1;
                setUiState(prev => ({ ...prev, score: state.score })); // Sync UI
            }
        }

        // Collision: Collectibles
        for (const c of collectibles.current) {
            if (!c.collected) {
                const bx = c.x - 10;
                const by = c.y - 15;
                if (d.x < bx + 20 && d.x + d.w > bx && d.y < by + 30 && d.y + d.h > by) {
                    c.collected = true;
                    if (c.type === 'battery') {
                        state.score += 5;
                        playGameSound('score');
                    } else if (c.type === 'shield') {
                        state.hasShield = true;
                        playGameSound('shield');
                    }
                    setUiState(prev => ({ ...prev, score: state.score }));
                    spawnParticles(c.x, c.y, 10, 'explosion'); 
                }
            }
        }

        // --- DRAW ---
        drawBackground(ctx, canvas.width, canvas.height);
        drawParticles(ctx);

        obstacles.current.forEach(obs => {
            drawGate(ctx, obs.x, obs.topHeight, GAP_SIZE, canvas.height);
        });

        collectibles.current.forEach(c => {
            drawCollectible(ctx, c);
        });

        if (!state.gameOver) {
            drawDrone(ctx, drone.current.x, drone.current.y, drone.current.rotation);
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(drone.current.x + 20, canvas.height - 20, 15, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (state.isPlaying) {
             requestRef.current = requestAnimationFrame(loop);
        }
    };

    const handleCrash = () => {
        gameRef.current.isPlaying = false;
        gameRef.current.gameOver = true;
        gameRef.current.highScore = Math.max(gameRef.current.score, gameRef.current.highScore);
        
        spawnParticles(drone.current.x, drone.current.y, 40, 'explosion');
        playGameSound('crash');
        
        // Sync UI for Game Over screen
        setUiState({ 
            isPlaying: false, 
            gameOver: true, 
            score: gameRef.current.score,
            highScore: gameRef.current.highScore
        });

        // Final draw for explosion
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.save();
                ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
                drawParticles(ctx);
                ctx.restore();
            }
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const handleInput = () => {
        if (gameRef.current.isPlaying) {
            drone.current.velocity = THRUST;
            spawnParticles(drone.current.x, drone.current.y + 10, 3, 'thrust');
            playGameSound('thrust');
        } else if (gameRef.current.gameOver || !gameRef.current.isPlaying) {
            startGame();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleInput();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
             window.removeEventListener('keydown', handleKeyDown);
             if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Initial render call
    useEffect(() => {
        if (!gameRef.current.isPlaying && canvasRef.current) {
             const ctx = canvasRef.current.getContext('2d');
             if(ctx) {
                 drawBackground(ctx, 800, 500);
                 if(!gameRef.current.gameOver) drawDrone(ctx, 100, 200, 0);
             }
        }
    }, [uiState.gameOver]);

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-5xl mx-auto">
            <div className="text-center mb-6">
                 <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                    <Gamepad className="w-8 h-8 text-cyan-400" />
                    FPV Simulator Mini
                </h2>
                <p className="text-gray-400 mt-1">Dodge gates & collect LiPos for speed boosts!</p>
            </div>
           
            <div className="relative w-full flex justify-center group select-none">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={500} 
                    className="border-2 border-gray-700 rounded-xl bg-gray-900 cursor-pointer shadow-2xl max-w-full hover:border-cyan-500/50 transition-colors touch-none"
                    onClick={handleInput}
                    onTouchStart={(e) => { e.preventDefault(); handleInput(); }}
                />
                
                {/* Overlay UI */}
                {!uiState.isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center p-8 bg-gray-900/95 rounded-2xl border border-cyan-500/30 backdrop-blur-md pointer-events-auto shadow-2xl transform transition-all">
                            {uiState.gameOver ? (
                                <>
                                    <h3 className="text-4xl font-black text-red-500 mb-2 uppercase tracking-wider">Wasted!</h3>
                                    <div className="flex gap-8 justify-center mb-6">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">Score</p>
                                            <p className="text-3xl font-bold text-white">{uiState.score}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">Best</p>
                                            <p className="text-3xl font-bold text-yellow-400">{uiState.highScore}</p>
                                        </div>
                                    </div>
                                    <Button onClick={startGame} className="w-full text-lg py-3 font-bold animate-pulse">
                                        Retry Mission
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-white mb-4">Ready to Race?</h3>
                                    <div className="space-y-3 mb-6 text-left bg-gray-800/50 p-5 rounded-lg text-sm text-gray-300">
                                        <p className="flex items-center gap-2"><Key className="w-4 h-4 text-white"/> <span className="text-white font-bold">Tap / Space</span> to Thrust</p>
                                        <p className="flex items-center gap-2"><span className="w-4 h-4 bg-yellow-500 rounded-full block"></span> Avoid <span className="text-yellow-400 font-bold">Gates</span></p>
                                        <p className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-sm block"></span> Collect <span className="text-green-400 font-bold">LiPos (+5 Pts)</span></p>
                                        <p className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-500 rounded-full block"></span> Grab <span className="text-blue-400 font-bold">Shields</span></p>
                                    </div>
                                    <Button onClick={startGame} className="w-full text-lg py-3 font-bold">
                                        Arm Motors
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {/* HUD */}
                {uiState.isPlaying && (
                    <div className="absolute top-4 left-0 right-0 flex justify-between px-6 pointer-events-none">
                         <div className="bg-gray-900/50 backdrop-blur px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-400 block tracking-widest">SCORE</span>
                            <span className="text-2xl font-mono font-bold text-white">{uiState.score}</span>
                        </div>
                        {gameRef.current.hasShield && (
                            <div className="bg-blue-500/20 backdrop-blur px-4 py-2 rounded-lg border border-blue-500 animate-pulse">
                                <span className="text-xs text-blue-300 block tracking-widest font-bold">SHIELD ACTIVE</span>
                            </div>
                        )}
                        <div className="bg-gray-900/50 backdrop-blur px-4 py-2 rounded-lg border border-gray-700">
                             <span className="text-xs text-gray-400 block tracking-widest">SPEED</span>
                             <span className="text-xl font-mono font-bold text-cyan-400">{Math.round(gameRef.current.speed * 10)} km/h</span>
                        </div>
                    </div>
                )}
            </div>
            
            <p className="text-gray-500 mt-6 text-xs text-center max-w-md">
                Pro Tip: The drone has inertia. Tap rhythmically to hover. Speed increases as you score higher!
            </p>
        </div>
    );
};
