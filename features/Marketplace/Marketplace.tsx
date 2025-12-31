
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
    ShoppingBag, Tag, Search, PlusCircle, Filter, X, 
    DollarSign, Activity, MessageSquare, Trash, 
    ShieldCheck, Key, Link, Video, Play, AlertCircle, Truck, Shield, Users, FileText, Loader, DollarSign as Cash,
    Map as MapIcon, Wind, Layers
} from '../../components/Icons';

interface Currency {
    code: string;
    symbol: string;
    rate: number; // Rate relative to USD
}

const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', rate: 1 },
    { code: 'EUR', symbol: '€', rate: 0.92 },
    { code: 'GBP', symbol: '£', rate: 0.79 },
    { code: 'JPY', symbol: '¥', rate: 150 },
    { code: 'AUD', symbol: 'A$', rate: 1.52 },
];

interface Carrier {
    id: string;
    name: string;
    baseRate: number;
    perKg: number;
    days: string;
    color: string;
}

const CARRIERS: Carrier[] = [
    { id: 'dhl', name: 'DHL Tactical', baseRate: 22, perKg: 8.5, days: '2-3 Days', color: 'text-yellow-400' },
    { id: 'fedex', name: 'FedEx Stealth', baseRate: 15, perKg: 6.2, days: '3-5 Days', color: 'text-purple-400' },
    { id: 'ups', name: 'UPS Ground Unit', baseRate: 8, perKg: 4.8, days: '5-7 Days', color: 'text-amber-600' },
];

interface ShippingZone {
    id: string;
    name: string;
    multiplier: number;
    icon: string;
}

const SHIPPING_ZONES: ShippingZone[] = [
    { id: 'z1', name: 'Domestic Base', multiplier: 1.0, icon: '🏠' },
    { id: 'z2', name: 'Trans-Regional', multiplier: 1.5, icon: '🌎' },
    { id: 'z3', name: 'Global Interlink', multiplier: 3.2, icon: '🌐' },
    { id: 'z4', name: 'Hostile/Remote', multiplier: 4.8, icon: '🛰️' },
];

interface Listing {
    id: string;
    title: string;
    price: number; // USD
    negotiatedPrice?: number; // USD
    offerStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
    category: 'Drone' | 'Gear' | 'Parts';
    condition: 'New' | 'Mint' | 'Good' | 'Fair';
    location: string;
    description: string;
    seller: string;
    postedAt: string;
    bankDetails?: string;
    escrowService: 'None' | 'HubShield' | 'DroneEscrow' | 'SafeTrade';
    verificationVideoUrl?: string;
    shippingInsuranceIncluded: boolean;
    shippingCostStrategy: 'Seller' | 'Buyer' | 'Split';
    buyerShippingPercentage: number;
    weightGrams: number;
    dimensions: { l: number; w: number; h: number };
}

const BUYER_TRANSACTION_FEE_USD = 1.00;

const INITIAL_LISTINGS: Listing[] = [
    {
        id: '1',
        title: 'DJI Mini 3 Pro with RC Controller',
        price: 550,
        category: 'Drone',
        condition: 'Mint',
        location: 'San Francisco, CA',
        description: 'Hardly used, includes extra batteries and carrying case.',
        seller: 'CloudSurfer99',
        postedAt: '2h ago',
        escrowService: 'HubShield',
        verificationVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        shippingInsuranceIncluded: true,
        shippingCostStrategy: 'Split',
        buyerShippingPercentage: 50,
        weightGrams: 249,
        dimensions: { l: 25, w: 30, h: 10 }
    },
    {
        id: '2',
        title: 'FatShark Dominator HDO2 Goggles',
        price: 320,
        category: 'Gear',
        condition: 'Good',
        location: 'Miami, FL',
        description: 'Lens are scratch-free. Comes with RapidFire module.',
        seller: 'FPV_Phantom',
        postedAt: '5h ago',
        escrowService: 'SafeTrade',
        verificationVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        shippingInsuranceIncluded: false,
        shippingCostStrategy: 'Buyer',
        buyerShippingPercentage: 100,
        weightGrams: 500,
        dimensions: { l: 20, w: 15, h: 12 }
    }
];

export const Marketplace: React.FC = () => {
    const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Drone' | 'Gear' | 'Parts'>('All');
    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
    
    // UI states
    const [showSellModal, setShowSellModal] = useState(false);
    const [showLogisticsTerminal, setShowLogisticsTerminal] = useState(false);
    const [viewVideoUrl, setViewVideoUrl] = useState<string | null>(null);
    const [checkoutItem, setCheckoutItem] = useState<Listing | null>(null);
    
    // Shipping Calculation State
    const [selectedZone, setSelectedZone] = useState<ShippingZone>(SHIPPING_ZONES[0]);
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier>(CARRIERS[1]); // Default FedEx
    const [calcProcessing, setCalcProcessing] = useState(false);

    // Logistics Terminal State (Global Calculator)
    const [terminalInput, setTerminalInput] = useState({
        weight: 1500,
        l: 30, w: 30, h: 15
    });

    // Seller form state
    const [newListing, setNewListing] = useState<Partial<Listing>>({
        category: 'Drone',
        condition: 'Good',
        escrowService: 'HubShield',
        price: 0,
        shippingInsuranceIncluded: false,
        shippingCostStrategy: 'Buyer',
        buyerShippingPercentage: 100,
        weightGrams: 500,
        dimensions: { l: 20, w: 20, h: 10 }
    });
    const [sellerVideo, setSellerVideo] = useState<{file: File, url: string} | null>(null);

    const formatPrice = (usdAmount: number, targetCurrency: Currency = currency) => {
        const converted = usdAmount * targetCurrency.rate;
        const decimals = targetCurrency.code === 'JPY' ? 0 : 2;
        return `${targetCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    };

    const calculateShipping = (weightG: number, dims: {l:number,w:number,h:number}, carrier: Carrier, zone: ShippingZone) => {
        const volWeight = (dims.l * dims.w * dims.h) / 5000;
        const billableWeight = Math.max(weightG / 1000, volWeight);
        const quote = (carrier.baseRate + (billableWeight * carrier.perKg)) * zone.multiplier;
        return quote;
    };

    const activeShippingQuote = useMemo(() => {
        if (!checkoutItem) return 0;
        return calculateShipping(checkoutItem.weightGrams, checkoutItem.dimensions, selectedCarrier, selectedZone);
    }, [checkoutItem, selectedCarrier, selectedZone]);

    const terminalQuotes = useMemo(() => {
        return CARRIERS.map(c => ({
            carrier: c,
            price: calculateShipping(terminalInput.weight, {l: terminalInput.l, w: terminalInput.w, h: terminalInput.h}, c, selectedZone)
        }));
    }, [terminalInput, selectedZone]);

    const handleCheckout = (item: Listing) => {
        setCheckoutItem(item);
        setSelectedZone(SHIPPING_ZONES[0]);
    };

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [listings, searchQuery, categoryFilter]);

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 p-2 lg:p-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-800/30 p-8 rounded-[3rem] border border-gray-800 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-cyan-500/10 rounded-3xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <ShoppingBag className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic">Hub Exchange</h2>
                        <div className="flex items-center gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-3">
                            <button onClick={() => setShowLogisticsTerminal(true)} className="flex items-center gap-2 text-cyan-400 hover:text-white transition-colors">
                                <Truck className="w-4 h-4"/> Logistics Terminal
                            </button>
                            <div className="h-4 w-px bg-gray-700 mx-1"></div>
                            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700">
                                <span className="text-gray-500">CURRENCY:</span>
                                <select 
                                    value={currency.code} 
                                    onChange={(e) => setCurrency(SUPPORTED_CURRENCIES.find(c => c.code === e.target.value) || SUPPORTED_CURRENCIES[0])}
                                    className="bg-transparent text-cyan-400 focus:outline-none cursor-pointer"
                                >
                                    {SUPPORTED_CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button 
                        onClick={() => setShowSellModal(true)} 
                        className="flex-1 md:flex-none px-10 py-5 bg-cyan-600 hover:bg-cyan-500 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-cyan-900/20"
                    >
                        <PlusCircle className="w-5 h-5 mr-3" />
                        Post Gear
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Search Sidebar */}
                <aside className="hidden lg:block w-72 flex-shrink-0">
                    <div className="sticky top-6 space-y-6 bg-gray-800/40 p-8 rounded-[3rem] border border-gray-800 shadow-xl">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Tactical Search</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter hardware..." className="w-full p-4 pl-12 bg-gray-900 border border-gray-700 rounded-2xl text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 rounded-[2rem] p-6 border border-emerald-500/10 space-y-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Safe Passage</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">"Shipping calculated via real-time carrier interlink. Funds held in HubShield Escrow."</p>
                        </div>

                        <Button onClick={() => setShowLogisticsTerminal(true)} variant="secondary" className="w-full py-4 rounded-2xl bg-gray-900 border border-gray-700 text-[10px] font-black uppercase">
                            <Truck className="w-4 h-4 mr-2" /> Shipping Estimator
                        </Button>
                    </div>
                </aside>

                {/* Listing Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredListings.map(item => (
                            <div key={item.id} className="group bg-gray-800 rounded-[3.5rem] border border-gray-700/50 overflow-hidden flex flex-col hover:border-cyan-500 transition-all duration-500 relative shadow-lg">
                                <div className="aspect-[1.3] bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-6 right-6 z-20">
                                        <button onClick={() => setViewVideoUrl(item.verificationVideoUrl!)} className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 rounded-full shadow-2xl border border-white/20 transform hover:scale-110 transition-transform"><Video className="w-5 h-5"/></button>
                                    </div>
                                    <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-2">
                                        <div className="bg-white text-gray-900 font-black px-5 py-2.5 rounded-2xl text-2xl shadow-2xl">
                                            {formatPrice(item.price)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-xl text-white leading-tight uppercase tracking-tighter">{item.title}</h3>
                                        <span className="text-[9px] font-black px-3 py-1.5 rounded-xl border border-gray-700 text-gray-500 bg-gray-900 uppercase tracking-widest">{item.category}</span>
                                    </div>
                                    <div className="flex items-center gap-4 py-2 border-y border-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-cyan-500" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.weightGrams}g</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.dimensions.l}x{item.dimensions.w}x{item.dimensions.h}cm</span>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleCheckout(item)} className="w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] bg-cyan-600 shadow-xl shadow-cyan-900/20 mt-2">
                                        Calculate Shipping
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logistics Terminal Modal (Quick Quote Tool) */}
            {showLogisticsTerminal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
                    <div className="bg-gray-800 w-full max-w-4xl rounded-[4rem] border border-gray-700 shadow-3xl overflow-hidden animate-fade-in relative">
                        <div className="p-10 border-b border-gray-700/50 flex justify-between items-center bg-cyan-500/5">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-cyan-500/20 rounded-3xl"><Truck className="w-8 h-8 text-cyan-400" /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Logistics Terminal</h3>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Global Freight Estimation Unit</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLogisticsTerminal(false)} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-3xl text-gray-300 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-cyan-500 pl-4 leading-none">Payload Configuration</h4>
                                    <div className="space-y-4 bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-700/50 shadow-inner">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Total Mass (Grams)</label>
                                            <input 
                                                type="number" 
                                                value={terminalInput.weight}
                                                onChange={e => setTerminalInput({...terminalInput, weight: Number(e.target.value)})}
                                                className="w-full p-5 bg-gray-900 border border-gray-700 rounded-2xl text-white font-black text-xl focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['l', 'w', 'h'].map(dim => (
                                                <div key={dim}>
                                                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 text-center">{dim.toUpperCase()} (cm)</label>
                                                    <input 
                                                        type="number" 
                                                        value={(terminalInput as any)[dim]}
                                                        onChange={e => setTerminalInput({...terminalInput, [dim]: Number(e.target.value)})}
                                                        className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold text-sm text-center focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-4 leading-none">Destination Zone</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {SHIPPING_ZONES.map(zone => (
                                            <button 
                                                key={zone.id}
                                                onClick={() => setSelectedZone(zone)}
                                                className={`p-5 rounded-[1.5rem] border text-left flex flex-col gap-2 transition-all ${selectedZone.id === zone.id ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg' : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-600'}`}
                                            >
                                                <span className="text-2xl">{zone.icon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tight leading-none">{zone.name}</span>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Multi: {zone.multiplier}x</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-amber-500 pl-4 leading-none">Real-Time Quotes</h4>
                                <div className="space-y-4 flex-1">
                                    {terminalQuotes.map(q => (
                                        <div key={q.carrier.id} className="bg-gray-900 p-6 rounded-[2.5rem] border border-gray-700/50 flex justify-between items-center group hover:border-cyan-500 transition-colors shadow-xl">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-gray-800 rounded-2xl group-hover:bg-gray-700 transition-colors"><Truck className={`w-6 h-6 ${q.carrier.color}`} /></div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tighter">{q.carrier.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{q.carrier.days} Estimate</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white tracking-tighter">{formatPrice(q.price)}</p>
                                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Total Payload Quote</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-gray-900/80 p-6 rounded-3xl border border-dashed border-gray-700 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] leading-relaxed">
                                        "Carrier rates synchronized with real-world logistics benchmarks. Final shipping costs subject to actual dimensions during dispatch."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Checkout Modal */}
            {checkoutItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
                    <div className="bg-gray-800 w-full max-w-4xl rounded-[4rem] border border-gray-700 shadow-3xl overflow-hidden animate-fade-in relative">
                        <div className="p-10 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/40">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Logistics Configurator</h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Escrow Secure Pipeline: {checkoutItem.id}</p>
                            </div>
                            <button onClick={() => setCheckoutItem(null)} className="p-4 bg-gray-700 rounded-3xl text-white hover:bg-gray-600 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left: Shipping Choice */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest leading-none">1. Select Destination Territory</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {SHIPPING_ZONES.map(zone => (
                                            <button 
                                                key={zone.id}
                                                onClick={() => {
                                                    setCalcProcessing(true);
                                                    setSelectedZone(zone);
                                                    setTimeout(() => setCalcProcessing(false), 500);
                                                }}
                                                className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedZone.id === zone.id ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-xl' : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{zone.name}</span>
                                                <span className="text-xl">{zone.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest leading-none">2. Compare Carriers</h4>
                                    <div className="space-y-3">
                                        {CARRIERS.map(carrier => {
                                            const quote = calculateShipping(checkoutItem.weightGrams, checkoutItem.dimensions, carrier, selectedZone);
                                            return (
                                                <button 
                                                    key={carrier.id}
                                                    onClick={() => setSelectedCarrier(carrier)}
                                                    className={`w-full p-5 rounded-3xl border flex justify-between items-center transition-all ${selectedCarrier.id === carrier.id ? 'bg-amber-500/5 border-amber-500 shadow-xl' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`p-3 rounded-xl bg-gray-800 ${selectedCarrier.id === carrier.id ? 'text-white' : 'text-gray-600'}`}>
                                                            <Truck className={`w-5 h-5 ${carrier.color}`} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs font-black text-white uppercase tracking-tighter">{carrier.name}</p>
                                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{carrier.days} Arrival</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-black ${selectedCarrier.id === carrier.id ? 'text-amber-400' : 'text-gray-400'}`}>{formatPrice(quote)}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Breakdown */}
                            <div className="lg:col-span-5 flex flex-col justify-between">
                                <div className="bg-gray-900 p-8 rounded-[3.5rem] border border-gray-700/50 space-y-8 shadow-inner">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Item Intel Base</span>
                                            <span className="text-white font-black">{formatPrice(checkoutItem.price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Carrier Quote</span>
                                            {calcProcessing ? <Loader className="w-4 h-4 text-cyan-400" /> : <span className="text-emerald-400 font-black">+{formatPrice(activeShippingQuote)}</span>}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Hub Protection Fee</span>
                                            <span className="text-white font-black">{formatPrice(BUYER_TRANSACTION_FEE_USD)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-700/50 flex flex-col gap-2">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Secure Transmission</p>
                                        <p className={`text-5xl font-black text-white tracking-tighter transition-all ${calcProcessing ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
                                            {formatPrice(checkoutItem.price + activeShippingQuote + BUYER_TRANSACTION_FEE_USD)}
                                        </p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => alert(`Mission Dispatched! ${selectedCarrier.name} will handle transport in ${selectedCarrier.days}.`)} 
                                    disabled={calcProcessing} 
                                    className="w-full py-7 rounded-[2.5rem] bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-cyan-900/30 mt-8"
                                >
                                    Initiate Escrow
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal - Same as existing but with better weight/dims grouping */}
            {showSellModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                    <div className="bg-gray-800 w-full max-w-5xl rounded-[4rem] border border-gray-700 my-8 overflow-hidden transform relative shadow-3xl animate-fade-in">
                        <div className="p-10 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/50 sticky top-0 z-20 backdrop-blur-md">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Hardware Intake</h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Pricing in {currency.code}</p>
                            </div>
                            <button onClick={() => setShowSellModal(false)} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-3xl text-gray-300 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={() => setShowSellModal(false)} className="p-10 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-5 group hover:border-cyan-500 transition-all shadow-inner">
                                        {!sellerVideo ? (
                                            <>
                                                <div className="p-7 bg-cyan-500/10 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                                                    <Video className="w-12 h-12 text-cyan-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Record 360° Verification</p>
                                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Visual condition proof mandatory</p>
                                                </div>
                                                <Button type="button" variant="secondary" onClick={() => (document.getElementById('sell-vid-up') as HTMLInputElement).click()} className="text-[9px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Uplink Proof</Button>
                                                <input type="file" id="sell-vid-up" accept="video/*" className="hidden" />
                                            </>
                                        ) : (
                                            <div className="w-full flex flex-col items-center gap-4">
                                                <video src={sellerVideo.url} className="max-h-48 rounded-2xl" />
                                                <button type="button" onClick={() => setSellerVideo(null)} className="text-red-400 text-[10px] font-black uppercase hover:underline">Reset Proof</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Hardware Title</label>
                                        <input required type="text" className="w-full p-6 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black uppercase tracking-tighter text-xl focus:ring-1 focus:ring-cyan-500 focus:outline-none shadow-inner" placeholder="E.G. GEP-CL35 V2 FRAME" />
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="bg-gray-900/50 p-10 rounded-[3.5rem] border border-gray-700/50 space-y-8 shadow-2xl">
                                        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest border-l-4 border-amber-500 pl-4 leading-none uppercase">Logistics Metadata</h4>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Weight (Grams)</label>
                                                <input type="number" defaultValue={500} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-2xl text-white font-black text-xl focus:outline-none focus:ring-1 focus:ring-amber-500" />
                                            </div>
                                            <div className="col-span-2 space-y-4">
                                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">Volumetric Data (cm)</label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {['l', 'w', 'h'].map(d => (
                                                        <input key={d} type="number" placeholder={d.toUpperCase()} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-2xl text-white font-black text-center" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Target Compensation ({currency.symbol})</label>
                                        <input type="number" required className="w-full p-7 bg-gray-900 border border-gray-700 rounded-[2.5rem] text-white font-black text-4xl focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-inner" placeholder="0" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full py-8 rounded-[3rem] font-black uppercase tracking-[0.6em] text-xs bg-cyan-600 hover:bg-cyan-500 shadow-3xl shadow-cyan-900/30">
                                Transmit to Global Exchange
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
