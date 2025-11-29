
import React, { useState } from 'react';
import { generateGroundedResponse, generateChatResponse } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Send, Link, Bot, Search, Calendar, Filter, Gamepad, X } from '../../components/Icons';
import Markdown from 'react-markdown';
import type { ChatMessage, GroundingSource } from '../../types';
import type { Feature } from '../../App';

const GETTING_STARTED_TOPICS = [
    'Basic Flight Controls',
    'Buying Your First Drone',
    'Controller Grip Styles (Pinch vs Thumb)',
    'Drone Laws & Regulations',
    'Drone Maintenance 101',
    'Finding a Community',
    'First Flight Drills',
    'Flight Modes Explained (GPS vs ATTI)',
    'Insurance for Pilots',
    'Lithium Battery Safety',
    'Pre-Flight Checklist',
    'Registration & Remote ID',
    'Safety First: Do\'s & Don\'ts',
    'Simulator Training',
    'Traveling with Drones',
    'Where to Fly (Airspace)'
];

const TACTICS = [
    '3D Mapping & Modeling',
    'Active Track / Follow Me',
    'Cinematic Panning',
    'Creeping Line Ahead (SAR)',
    'Crop Spraying Patterns',
    'Dolly Zoom (Vertigo Effect)',
    'Drone Jib/Crane Shot',
    'Dronie Shot',
    'Expanding Square Search (SAR)',
    'FPV Dive',
    'FPV Matty Flip',
    'FPV Orbit',
    'FPV Power Loop',
    'FPV Rubiks Cube',
    'FPV Split-S Maneuver',
    'FPV Trippy Spin',
    'HDR Bracketing',
    'Hyperlapse Video',
    'Lidar Scanning',
    'Long-Exposure Photography',
    'ND Filter Usage',
    'Orbit Mode',
    'Panorama Stitching',
    'Photogrammetry Overlap',
    'Point of Interest (POI) Lock',
    'Reveal Shot',
    'Structure Inspection (Vertical)',
    'Thermal Inspection Patterns',
    'Top-Down / Bird\'s Eye View',
    'Tripod Mode / Cine Mode',
    'Waypoint Navigation',
];

const BUILDING_TOPICS = [
    'Antenna Placement & Polarization',
    'Battery Safety & Management',
    'Betaflight Setup Guide',
    'Blackbox Logging Setup',
    'Cable Management Techniques',
    'Capacitors & Noise Filtering',
    'Choosing Motors & ESCs',
    'Conformal Coating (Waterproofing)',
    'Flight Controller Wiring',
    'FPV Camera & VTX Setup',
    'Frame Selection Guide',
    'GPS Rescue Configuration',
    'Propeller Direction & Mounting',
    'Receiver Binding (ELRS/TBS)',
    'Smoke Stopper Usage',
    'Soft Mounting Electronics',
    'Soldering 101 for Drones',
    'Step-by-Step Build Overview',
    'Tuning PIDs Basics',
    'Video Transmitter (VTX) Tables'
];

const RACING_TOPICS = [
    '5-Inch Freestyle vs Racing',
    'Analog vs Digital Latency',
    'Battery Heating & Management',
    'Building a Dedicated Racer',
    'Choosing a Racing Frame (True X vs Stretched)',
    'FPV Camera Angle & Lens Choice',
    'Gate & Flag Types',
    'Getting Sponsored',
    'Global Racing Leagues (DRL, DCL, MultiGP)',
    'Lap Timing Systems (LapRF/ImmersionRC)',
    'MultiGP Race Formats (Global Qualifier)',
    'Pit Crew & Spotter Duties',
    'Race Day Checklist & Etiquette',
    'Race Director Flags & Penalties',
    'Racing Classes (Whoops, 5", X-Class)',
    'Racing Motor KV & Stator Size',
    'Spec Class Racing',
    'Tiny Whoop Racing (IGOW)',
    'Transponder Placement & Setup',
    'Weight Reduction Techniques'
];

const RACING_TECHNIQUES = [
    'Apexing Corners (Late vs Early)',
    'Dealing with Prop Wash',
    'Dive Gate Entry',
    'Gate Entry & Exit Strategies',
    'Launching (Race Start Reaction)',
    'Look-Ahead Techniques',
    'Managing Adrenaline',
    'Matty Flip (Reverse Gate Entry)',
    'Mid-Air Collision Avoidance',
    'Momentum Preservation',
    'Passing Strategies (High vs Low)',
    'Power Looping Gates',
    'Recovery from Crashes (Turtle Mode)',
    'Rubiks Cube Maneuver',
    'Slingshot Cornering',
    'Split-S Gate Transition',
    'Throttle Control in Tight Turns',
    'Trippy Spin (Gate Orbit)',
    'Vertical Hairpin Turns',
    'Visual Spotting Points'
];

const MAINTENANCE_TOPICS = [
    'Battery Connector (XT60) Wear',
    'Battery Storage Voltage (3.8V/cell)',
    'Brushless Motor Cleaning',
    'Carbon Fiber Frame Delamination',
    'Conformal Coating Inspection',
    'Crash Damage Assessment',
    'ESC & Flight Controller Diagnostics',
    'Firmware Updates (Betaflight/DJI)',
    'Gimbal Calibration & Care',
    'Lens Cleaning & Sensor Protection',
    'Long-Term Storage Prep',
    'Motor Bearing Lubrication',
    'Post-Flight Cleaning Routine',
    'Pre-Flight Checklist',
    'Propeller Balancing',
    'Propeller Inspection (Stress Marks)',
    'Receiver Antenna Integrity',
    'Screw Tightening (Loctite Check)',
    'Soldering Joint Inspection',
    'Troubleshooting Video Noise'
];

const DRL_TOPICS = [
    'Current Season Schedule',
    'Live Pilot Standings',
    'Latest Race Results',
    'Next Broadcast Event',
    'Championship Leaderboard'
];

const QUICK_EVENT_LINKS = [
    'Major Drone Conferences 2024/2025',
    'Upcoming Drone Light Shows',
    'FPV Racing World Cup',
    'Part 107 Study Workshops'
];

const EVENT_TYPES = ['All Types', 'Racing', 'Conferences', 'Expos', 'Light Shows', 'Workshops', 'Webinars'];
const REGIONS = ['Global', 'North America', 'Europe', 'Asia', 'Online'];
const TIMEFRAMES = ['Upcoming', 'This Month', 'Next 3 Months', 'This Year'];

const WEATHER_TOPICS = [
    'Cold Weather: Battery Performance',
    'Cold Weather: Propeller Icing',
    'Cold Weather: Snow & Sensor Glitch',
    'Desert Flying: Sand & Dust Protection',
    'Fog & Mist: Visibility & Moisture',
    'Heat: Device Cooling & Overheating',
    'High Altitude: Air Density & Lift',
    'Humidity: Condensation Risks',
    'Marine Flying: Salt Spray & Corrosion',
    'Night Flying: Vision Systems & LEDs',
    'Rain: Waterproofing (Conformal Coating)',
    'Solar Activity: Kp Index & GPS Lock',
    'Thunderstorms: EMI & Lightning Risks',
    'Urban Wind Tunnels',
    'Wind: Handling Gusts & Drift',
    'Wind: Shear & Turbulence'
];

const TERMINOLOGY_TOPICS = [
    'Accelerometer & Gyro (IMU)',
    'Air Mode',
    'Angle vs Horizon vs Acro Mode',
    'Barometer (Altitude Hold)',
    'BEC (Battery Eliminator Circuit)',
    'Bind-N-Fly (BNF) vs PNP vs RTF',
    'Blackbox Logging',
    'Brushless vs Brushed Motors',
    'C-Rating (Discharge Rate)',
    'Damping Light / Active Braking',
    'DSHOT vs Multishot vs OneShot',
    'ELRS (ExpressLRS) vs Crossfire',
    'ESC (Electronic Speed Controller)',
    'Failsafe Mode',
    'Flight Controller (FC)',
    'FPV (First Person View)',
    'Gimbal (2-Axis vs 3-Axis)',
    'GPS (Return to Home)',
    'Ground Station',
    'Headless Mode',
    'KV Rating (Velocity Constant)',
    'LiPo vs Li-Ion Batteries',
    'Loiter Mode',
    'Magnetometer (Compass)',
    'OSD (On-Screen Display)',
    'PDB (Power Distribution Board)',
    'PID Tuning (P, I, D Terms)',
    'Prop Wash',
    'Rates (RC, Super, Expo)',
    'RSSI vs LQ (Link Quality)',
    'Rx & Tx (Receiver & Transmitter)',
    'Spotter',
    'Telemetry',
    'UART & Serial Ports',
    'V-Bat (Battery Voltage)',
    'Visual Observer (VO)',
    'VTX (Video Transmitter)',
    'Waypoints',
    'Yaw, Pitch, Roll, Throttle'
];

const DRONE_TYPES = [
    'Camera Drones',
    'FPV Racing Drones',
    'Cinewhoops',
    'Micro/Toy Drones',
    'Enterprise Drones',
    'Agricultural Drones',
    'Long-Range Drones',
    'Autonomous Drones',
    'Fixed-Wing Drones',
    'Underwater Drones',
    'Delivery Drones',
    'Light Show Drones'
];

const GEAR_TOPICS = [
    'Analog vs Digital FPV Latency',
    'Antenna Connectors (SMA/RP-SMA/MMCX)',
    'Box Goggles vs Low-Profile Goggles',
    'Controller Form Factors (Gamepad vs Full-Size)',
    'Crossfire vs ExpressLRS (ELRS)',
    'DJI O3 vs Air Unit vs Vista',
    'EdgeTX vs OpenTX Firmware',
    'ELRS Packet Rates (150Hz vs 500Hz)',
    'Gimbal Mechanics (Hall Effect vs Potentiometer)',
    'Gimbal Stick Ends & Grip Types',
    'HDZero System Overview',
    'Head Tracking Configuration',
    'Long Range RF (900MHz vs 2.4GHz)',
    'Multiprotocol Modules (4-in-1)',
    'Patch vs Omni Antennas',
    'Radio Battery Mods (Li-ion 18650)',
    'Receiver Binding Methods',
    'Simulator Wireless Dongles',
    'Video Receiver Modules (RapidFire vs Fusion)',
    'Walksnail Avatar System'
];

const SIMULATOR_TOPICS = [
    'AI Drone Simulator',
    'DCL - The Game',
    'DRL Simulator (Drone Racing League)',
    'EreaDrone',
    'Flowstate',
    'FPV Freerider',
    'FPV.SkyDive',
    'GTA V (FPV Mod)',
    'Liftoff: FPV Drone Racing',
    'Liftoff: Micro Drones',
    'Orqa FPV.Skydive',
    'Tiny Whoop GO',
    'Tryp FPV',
    'Uncrashed: FPV Drone Simulator',
    'Velocidrone',
    'Zephyr Drone Simulator'
];

interface DronepediaProps {
    setActiveFeature: (feature: Feature) => void;
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const Dronepedia: React.FC<DronepediaProps> = ({ setActiveFeature, setChatHistory }) => {
    const [searchPrompt, setSearchPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sources, setSources] = useState<GroundingSource[] | undefined>(undefined);
    const [lastQuery, setLastQuery] = useState('');
    
    // Calendar Filters
    const [filterType, setFilterType] = useState('All Types');
    const [filterRegion, setFilterRegion] = useState('Global');
    const [filterTime, setFilterTime] = useState('Upcoming');

    const [topicFilter, setTopicFilter] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchPrompt.trim()) return;
        setLastQuery(searchPrompt);
        await performSearch(searchPrompt);
    };

    const performSearch = async (query: string) => {
        setIsLoading(true);
        setResult(null);
        setSources(undefined);
        try {
            const response = await generateGroundedResponse(query, 'googleSearch');
            setResult(response.text);
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                 const extractedSources = chunks
                    .map((chunk: any) => {
                        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
                        if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
                        return null;
                    })
                    .filter((s: any) => s !== null) as GroundingSource[];
                setSources(extractedSources);
            }

        } catch (error) {
            console.error("Search failed:", error);
            setResult("Sorry, I encountered an error while searching.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (topic: string, promptTemplate: (t: string) => string) => {
        setSearchPrompt(topic);
        setLastQuery(topic);
        setIsLoading(true);
        setResult(null);
        setSources(undefined);
        try {
            const prompt = promptTemplate(topic);
            const response = await generateChatResponse([], prompt, 'gemini-3-pro-preview');
            setResult(response.text);
        } catch (error) {
             console.error("Generation failed:", error);
             setResult("Sorry, I couldn't generate that information right now.");
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleCalendarSearch = () => {
        const query = `List ${filterTime} ${filterType === 'All Types' ? '' : filterType} drone events in ${filterRegion}. 
        Include specific dates, locations, and brief descriptions for each event. 
        Format as a calendar list.`;
        setSearchPrompt(`Calendar: ${filterType} in ${filterRegion} (${filterTime})`);
        setLastQuery(query);
        performSearch(query);
    }

    const handleGettingStartedClick = (topic: string) => {
        handleGenerate(topic, (t) => `Provide a comprehensive beginner's guide on "${t}" for drone pilots.
        Format the response with Markdown.
        Include sections for:
        1. **Overview**: What it is and why it matters.
        2. **Key Steps/Instructions**: Actionable advice.
        3. **Safety Considerations**: Vital safety rules.
        4. **Pro Tips**: Advice from experienced pilots.
        5. **Common Mistakes**: What to avoid.`);
    };

    const handleTacticClick = (tactic: string) => {
        handleGenerate(tactic, (t) => `Explain the drone technique or tactic: "${t}".
        Provide a step-by-step guide on how to execute it safely.
        Include:
        - Ideal use cases (e.g., cinematic, inspection, SAR).
        - Required skill level.
        - Camera settings (if applicable).
        - Flight pattern diagram description.`);
    };

    const handleBuildingClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as an expert drone engineer. Provide a detailed technical guide on "${t}".
        Structure the response as follows:
        1. **Technical Context**: How it works and why it's critical.
        2. **Selection Guide**: What to look for (specs, compatibility).
        3. **Installation/Assembly**: Step-by-step wiring or mounting instructions.
        4. **Configuration**: Betaflight/Software settings if applicable.
        5. **Common Pitfalls**: Mistakes that lead to failure or smoke.`);
    };

    const handleRacingClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as a professional drone racing coach. Provide a deep dive on "${t}".
        Include:
        - **Context**: Why this matters in a race scenario.
        - **Rules & Specs**: Relevant class restrictions or league rules.
        - **Strategy**: How to use this to win or fly faster.
        - **Common Mistakes**: Where new racers go wrong.`);
    };
    
    const handleRacingTechniqueClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as an elite FPV racing pilot. Teach me how to execute the "${t}" maneuver.
        Focus on:
        1. **Stick Inputs**: Detailed breakdown of throttle, pitch, roll, and yaw movements.
        2. **Physics & Momentum**: How the drone behaves during the move.
        3. **Simulator Drills**: A progressive practice routine to master this.
        4. **Race Application**: When to use this on a track.`);
    };

    const handleMaintenanceClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as a certified drone technician. Provide a maintenance guide for "${t}".
        Structure:
        1. **Tools & Supplies Needed**: Specific screwdrivers, chemicals, or spares.
        2. **Step-by-Step Procedure**: Detailed walkthrough.
        3. **Frequency**: How often should this be done?
        4. **Red Flags**: Warning signs that immediate replacement is needed.`);
    };

    const handleWeatherClick = (topic: string) => {
        handleGenerate(topic, (t) => `Create a safety and operational guide for flying drones in this condition: "${t}".
        Include:
        1. **Risk Assessment**: Primary dangers to the aircraft and electronics.
        2. **Equipment Preparation**: Modifications or checks (e.g., waterproofing, battery warmth).
        3. **Flight Characteristics**: How the drone handles differently.
        4. **Post-Flight Care**: Cleanup or drying procedures.`);
    };

    const handleTerminologyClick = (topic: string) => {
        handleGenerate(topic, (t) => `Define the drone term "${t}" as a dictionary entry.
        Include:
        - **Definition**: Simple, clear explanation.
        - **Technical Function**: What it actually does electronically or aerodynamically.
        - **Key Specs/Values**: Common numbers seen (e.g., for KV, C-rating).
        - **Real-World Example**: A sentence using the term correctly.`);
    };
    
    const handleDroneTypeClick = (topic: string) => {
        handleGenerate(topic, (t) => `Provide a detailed profile for "${t}".
        Include:
        1. **Typical Features**: Weight, range, sensors.
        2. **Primary Uses**: Industries or hobbies that use this.
        3. **Pros & Cons**: Advantages and limitations.
        4. **Example Models**: Popular drones in this category.`);
    };

    const handleGearClick = (topic: string) => {
        handleGenerate(topic, (t) => `Act as an FPV equipment expert. Provide a detailed technical breakdown for "${t}".
        Structure the response:
        1. **Technical Specifications**: Key metrics (latency, range, resolution, or frequency).
        2. **Ecosystem & Compatibility**: What hardware/software does this work with?
        3. **User Experience**: Ergonomics, ease of use, or build quality.
        4. **Pro-Level Config**: Advanced settings or mods for peak performance.
        5. **Verdict**: Who is this best for (Beginner, Racer, Long-Range)?`);
    };

    const handleSimulatorClick = (topic: string) => {
        handleGenerate(topic, (t) => `Provide a detailed review and guide for the drone simulator/game "${t}".
        Include:
        1. **Physics Realism**: How does it compare to real life?
        2. **Key Features**: Map editor, multiplayer, customization.
        3. **System Requirements**: Is it heavy or runs on potato PCs?
        4. **Target Audience**: Beginners, Freestylers, or Racers?
        5. **Price/Platform**: Steam, Console, Mobile?`);
    };

    const handleDRLClick = (topic: string) => {
        setSearchPrompt(topic);
        setLastQuery(topic);
        performSearch(`Current information about Drone Racing League (DRL) ${topic} detailed and up to date`);
    };

    const handleEventClick = (topic: string) => {
        setSearchPrompt(topic);
        setLastQuery(topic);
        performSearch(`Upcoming ${topic} details dates location registration`);
    };

    const handleDiscussInChat = () => {
        if (!result) return;
        
        const newHistory: ChatMessage[] = [
            { role: 'user', parts: [{ text: lastQuery }] },
            { role: 'model', parts: [{ text: result }], sources: sources }
        ];

        setChatHistory(prev => [...prev, ...newHistory]);
        setActiveFeature('Chatbot');
    };

    const filterTopics = (topics: string[]) => {
        if (!topicFilter.trim()) return topics;
        return topics.filter(t => t.toLowerCase().includes(topicFilter.toLowerCase()));
    };

    const filteredGettingStarted = filterTopics(GETTING_STARTED_TOPICS);
    const filteredTypes = filterTopics(DRONE_TYPES);
    const filteredTactics = filterTopics(TACTICS);
    const filteredBuilding = filterTopics(BUILDING_TOPICS);
    const filteredRacing = filterTopics(RACING_TOPICS);
    const filteredRacingTechniques = filterTopics(RACING_TECHNIQUES);
    const filteredGear = filterTopics(GEAR_TOPICS);
    const filteredSimulators = filterTopics(SIMULATOR_TOPICS);
    const filteredWeather = filterTopics(WEATHER_TOPICS);
    const filteredMaintenance = filterTopics(MAINTENANCE_TOPICS);
    const filteredDRL = filterTopics(DRL_TOPICS);
    const filteredTerminology = filterTopics(TERMINOLOGY_TOPICS);
    const filteredEvents = filterTopics(QUICK_EVENT_LINKS);
    
    // Show calendar if searching for events, calendar, or specific event types
    const showCalendar = !topicFilter || ['event', 'calendar', 'race', 'show', 'conference'].some(k => topicFilter.toLowerCase().includes(k)) || filteredEvents.length > 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
             <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Dronepedia Knowledge Base</h2>
                <p className="text-gray-400">Search the web or browse curated topics for instant expert answers.</p>
             </div>

            {/* Main Search */}
            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
                <input
                    id="dronepedia-search"
                    type="text"
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    placeholder="Search for drone info (e.g., 'DJI Mini 4 Pro specs', 'Part 107 rules')"
                    className="w-full p-4 pl-12 pr-36 bg-gray-800 border border-gray-700 rounded-full focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                
                {searchPrompt && (
                    <button
                        type="button"
                        onClick={() => setSearchPrompt('')}
                        className="absolute right-28 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                        title="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <Button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6">
                    {isLoading ? <Spinner /> : 'Search'}
                </Button>
            </form>

            {/* Results Area */}
            {(result || isLoading) && (
                <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 animate-fade-in">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Spinner />
                            <p className="text-cyan-400 font-medium">Scanning frequencies for answers...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="prose prose-invert max-w-none">
                                <div className="markdown-body">
                                    <Markdown>{result}</Markdown>
                                </div>
                            </div>
                            
                            {sources && sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sources.map((source, idx) => (
                                            <a 
                                                key={idx} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 px-3 py-1.5 rounded-full transition-colors"
                                            >
                                                <Link className="w-3 h-3 mr-1" />
                                                {source.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
                                <Button onClick={handleDiscussInChat} variant="secondary" className="text-sm">
                                    <Bot className="w-4 h-4 mr-2" />
                                    Discuss in Chat
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Topic Filter Bar */}
            <div className="max-w-xl mx-auto relative">
                <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder="Filter topics (e.g., 'Motors', 'Racing', 'Weather')"
                    className="w-full p-3 pl-10 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                {topicFilter && (
                    <button
                        onClick={() => setTopicFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 {/* Getting Started */}
                {filteredGettingStarted.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center">
                            <span className="bg-green-500/10 p-2 rounded-lg mr-3">🚀</span>
                            Getting Started
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredGettingStarted.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleGettingStartedClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-green-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drone Types */}
                {filteredTypes.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-teal-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-teal-400 mb-4 flex items-center">
                            <span className="bg-teal-500/10 p-2 rounded-lg mr-3">🛸</span>
                            Types & Uses
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleDroneTypeClick(type)}
                                    className="text-xs bg-gray-700 hover:bg-teal-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tactics & Techniques */}
                {filteredTactics.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center">
                            <span className="bg-cyan-500/10 p-2 rounded-lg mr-3">📸</span>
                            Tactics & Techniques
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredTactics.map((tactic) => (
                                <button
                                    key={tactic}
                                    onClick={() => handleTacticClick(tactic)}
                                    className="text-xs bg-gray-700 hover:bg-cyan-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {tactic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Building & Engineering */}
                {filteredBuilding.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center">
                             <span className="bg-yellow-500/10 p-2 rounded-lg mr-3">🛠️</span>
                            Building & Engineering
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredBuilding.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleBuildingClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-yellow-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Racing Hub */}
                {filteredRacing.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center">
                            <span className="bg-orange-500/10 p-2 rounded-lg mr-3">🏁</span>
                            Drone Racing Hub
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredRacing.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleRacingClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-orange-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Advanced Racing Tactics */}
                {filteredRacingTechniques.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center">
                            <span className="bg-indigo-500/10 p-2 rounded-lg mr-3">🏎️</span>
                            Advanced Racing Tactics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredRacingTechniques.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleRacingTechniqueClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-indigo-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Headsets & Controllers */}
                {filteredGear.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-emerald-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
                            <span className="bg-emerald-500/10 p-2 rounded-lg mr-3">🎮</span>
                            Headsets & Controllers
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredGear.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleGearClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-emerald-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Simulators & Games */}
                {filteredSimulators.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-violet-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center">
                            <span className="bg-violet-500/10 p-2 rounded-lg mr-3"><Gamepad className="w-5 h-5"/></span>
                            Simulators & Games
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredSimulators.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleSimulatorClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-violet-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weather Flying Guide */}
                {filteredWeather.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-blue-400/50 transition-colors">
                        <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center">
                            <span className="bg-blue-500/10 p-2 rounded-lg mr-3">⛈️</span>
                            Weather Flying Guide
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredWeather.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleWeatherClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-blue-500 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Maintenance & Care */}
                {filteredMaintenance.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-pink-400 mb-4 flex items-center">
                            <span className="bg-pink-500/10 p-2 rounded-lg mr-3">🔧</span>
                            Maintenance & Care
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredMaintenance.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleMaintenanceClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-pink-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                 {/* Drone Events Calendar */}
                 {showCalendar && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-fuchsia-500/50 transition-colors flex flex-col h-full">
                        <h3 className="text-lg font-bold text-fuchsia-400 mb-4 flex items-center">
                            <span className="bg-fuchsia-500/10 p-2 rounded-lg mr-3"><Calendar className="w-5 h-5"/></span>
                            Drone Events Calendar
                        </h3>
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                                <Filter className="w-4 h-4 text-gray-400"/>
                                <select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-transparent text-sm text-white focus:outline-none w-full cursor-pointer"
                                >
                                    {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                                <span className="text-gray-400 text-xs font-bold w-4 text-center">📍</span>
                                <select 
                                    value={filterRegion} 
                                    onChange={(e) => setFilterRegion(e.target.value)}
                                    className="bg-transparent text-sm text-white focus:outline-none w-full cursor-pointer"
                                >
                                    {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                                <span className="text-gray-400 text-xs font-bold w-4 text-center">🕒</span>
                                <select 
                                    value={filterTime} 
                                    onChange={(e) => setFilterTime(e.target.value)}
                                    className="bg-transparent text-sm text-white focus:outline-none w-full cursor-pointer"
                                >
                                    {TIMEFRAMES.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <Button onClick={handleCalendarSearch} className="w-full text-xs py-2 mt-1">
                                Find Events
                            </Button>
                        </div>
                        
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Quick Links:</p>
                            <div className="flex flex-wrap gap-2">
                                {filteredEvents.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => handleEventClick(topic)}
                                        className="text-[10px] bg-gray-700 hover:bg-fuchsia-600 hover:text-white text-gray-300 px-2 py-1 rounded-full transition-colors"
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* DRL Live Intel */}
                {filteredDRL.length > 0 && (
                     <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-red-600/50 transition-colors">
                        <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center">
                            <span className="bg-red-500/10 p-2 rounded-lg mr-3">🏆</span>
                            DRL Live Intel
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                            Official standings, race schedules, and results powered by real-time search.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {filteredDRL.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleDRLClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-red-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Common Terminology */}
                {filteredTerminology.length > 0 && (
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors">
                        <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                            <span className="bg-purple-500/10 p-2 rounded-lg mr-3">📖</span>
                            Common Terminology
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {filteredTerminology.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleTerminologyClick(topic)}
                                    className="text-xs bg-gray-700 hover:bg-purple-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-md transition-colors text-left"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
