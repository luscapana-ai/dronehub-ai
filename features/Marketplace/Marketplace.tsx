
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
    ShoppingBag, Tag, Search, PlusCircle, Filter, X, 
    DollarSign, Activity, MessageSquare, Trash, 
    ShieldCheck, Key, Link, Video, Play, AlertCircle, Truck, Shield, Users, FileText, Loader,
    Map as MapIcon, Wind, Layers, CheckCircle2
} from '../../components/Icons';
import { analyzeImage } from '../../services/geminiService';
import { Spinner } from '../../components/ui/Spinner';

interface Currency {
    code: string;
    symbol: string;
    rate: number; 
}

const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', rate: 1 },
    { code: 'EUR', symbol: '€', rate: 0.92 },
    { code: 'GBP', symbol: '£', rate: 0.79 },
    { code: 'JPY', symbol: '¥', rate: 150 },
    { code: 'AUD', symbol: 'A$', rate: 1.52 },
];

const CARRIERS = [
    { id: 'dhl', name: 'DHL Tactical', baseRate: 22, perKg: 8.5, days: '2-3 Days', color: 'text-yellow-400' },
    { id: 'fedex', name: 'FedEx Stealth', baseRate: 15, perKg: 6.2, days: '3-5 Days', color: 'text-purple-400' },
    { id: 'ups', name: 'UPS Ground Unit', baseRate: 8, perKg: 4.8, days: '5-7 Days', color: 'text-amber-600' },
];

const SHIPPING_ZONES = [
    { id: 'z1', name: 'Domestic Base', multiplier: 1.0, icon: '🏠' },
    { id: 'z2', name: 'Trans-Regional', multiplier: 1.5, icon: '🌎' },
    { id: 'z3', name: 'Global Interlink', multiplier: 3.2, icon: '🌐' },
    { id: 'z4', name: 'Hostile/Remote', multiplier: 4.8, icon: '🛰️' },
];

interface Listing {
    id: string;
    title: string;
    price: number;
    category: 'Drone' | 'Gear' | 'Parts';
    condition: 'New' | 'Mint' | 'Good' | 'Fair';
    location: string;
    description: string;
    seller: string;
    postedAt: string;
    isVerified: boolean;
    verificationReport?: string;
    escrowService: 'HubShield' | 'DroneEscrow' | 'SafeTrade';
    weightGrams: number;
    dimensions: { l: number; w: number; h: number };
}

const STORAGE_KEY = 'drone_hub_marketplace';

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
        isVerified: true,
        verificationReport: 'AI Visual Scan: Primary gimbal axis clear. Frame integrity 100%. Propeller condition: Nominal.',
        escrowService: 'HubShield',
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
        isVerified: false,
        escrowService: 'SafeTrade',
        weightGrams: 500,
        dimensions: { l: 20, w: 15, h: 12 }
    }
];

export const Marketplace: React.FC = () => {
    const [listings, setListings] = useState<Listing[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_LISTINGS;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Drone' | 'Gear' | 'Parts'>('All');
    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
    
    const [showSellModal, setShowSellModal] = useState(false);
    const [checkoutItem, setCheckoutItem] = useState<Listing | null>(null);
    const [selectedZone, setSelectedZone] = useState(SHIPPING_ZONES[0]);
    const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[1]);

    const [newTitle, setNewTitle] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newWeight, setNewWeight] = useState('');

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
    }, [listings]);

    // Check for Hangar-to-Marketplace bridge payload (RC-2)
    useEffect(() => {
        const payload = localStorage.getItem('market_draft_payload');
        if (payload) {
            const draft = JSON.parse(payload);
            setNewTitle(draft.title);
            setNewDesc(draft.description);
            setNewPrice(draft.price.toString());
            setNewWeight(draft.weightGrams.toString());
            setShowSellModal(true);
            localStorage.removeItem('market_draft_payload');
        }
    }, []);

    const formatPrice = (usdAmount: number, targetCurrency: Currency = currency) => {
        const converted = usdAmount * targetCurrency.rate;
        const decimals = targetCurrency.code === 'JPY' ? 0 : 2;
        return `${targetCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    };

    const handleCheckout = (item: Listing) => setCheckoutItem(item);

    const calculateShipping = (weightG: number, dims: {l:number,w:number,h:number}, carrier: any, zone: any) => {
        const volWeight = (dims.l * dims.w * dims.h) / 5000;
        const billableWeight = Math.max(weightG / 1000, volWeight);
        return (carrier.baseRate + (billableWeight * carrier.perKg)) * zone.multiplier;
    };

    const activeShippingQuote = useMemo(() => {
        if (!checkoutItem) return 0;
        return calculateShipping(checkoutItem.weightGrams, checkoutItem.dimensions, selectedCarrier, selectedZone);
    }, [checkoutItem, selectedCarrier, selectedZone]);

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [listings, searchQuery, categoryFilter]);

    const handleAddListing = () => {
        if (!newTitle || !newPrice) return;
        const item: Listing = {
            id: `l-${Date.now()}`,
            title: newTitle,
            price: Number(newPrice),
            category: 'Drone',
            condition: 'Mint',
            location: 'Authenticated Hub',
            description: newDesc,
            seller: 'Local_Verified_Pilot',
            postedAt: 'Just now',
            isVerified: true,
            escrowService: 'HubShield',
            weightGrams: Number(newWeight) || 500,
            dimensions: { l: 20, w: 20, h: 10 }
        };
        setListings([item, ...listings]);
        setShowSellModal(false);
        setNewTitle(''); setNewPrice(''); setNewDesc(''); setNewWeight('');
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-20 animate-fade-in">
            {/* Header HUD */}
            <div className="bg-gray-800/20 p-10 rounded-[4rem] border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="flex items-center gap-8 z-10">
                    <div className="p-6 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/20 shadow-xl shadow-cyan-900/10">
                        <ShoppingBag className="w-12 h-12 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Market Exchange</h2>
                        <div className="flex gap-4 mt-4">
                            <select 
                                value={currency.code} 
                                onChange={(e) => setCurrency(SUPPORTED_CURRENCIES.find(c => c.code === e.target.value) || SUPPORTED_CURRENCIES[0])}
                                className="bg-gray-900/80 px-4 py-2 rounded-2xl border border-gray-700 text-cyan-400 font-black text-xs"
                            >
                                {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">HubShield: On</span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button onClick={() => setShowSellModal(true)} className="w-full md:w-auto px-12 py-6 bg-cyan-600 hover:bg-cyan-500 rounded-3xl font-black uppercase tracking-widest text-xs transition-all">
                    <PlusCircle className="w-5 h-5 mr-3" /> Commission Gear
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                <aside className="w-full lg:w-72 space-y-6">
                    <div className="bg-gray-800/20 p-8 rounded-[3rem] border border-white/5 shadow-xl space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Hardware Scan</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder="Filter models..." 
                                    className="w-full p-4 pl-12 bg-gray-900 border border-gray-700 rounded-2xl text-[11px] font-bold text-white focus:outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Sectors</label>
                            <div className="flex flex-col gap-2">
                                {['All', 'Drone', 'Gear', 'Parts'].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat as any)}
                                        className={`w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-900'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredListings.map(item => (
                        <div key={item.id} className="group bg-gray-800/20 rounded-[4rem] border border-white/5 p-8 flex flex-col gap-6 hover:border-cyan-500/50 transition-all duration-500 shadow-xl relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gray-900 rounded-[2rem] border border-gray-800 shadow-inner group-hover:bg-cyan-500/5 transition-colors">
                                        <Layers className="w-6 h-6 text-gray-600 group-hover:text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{item.title}</h3>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[8px] font-black px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-500 rounded uppercase">{item.category}</span>
                                            <span className="text-[8px] font-black px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded uppercase">{item.condition}</span>
                                        </div>
                                    </div>
                                </div>
                                {item.isVerified && (
                                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-gray-800 shadow-inner flex-1 flex flex-col justify-between">
                                <p className="text-xs text-gray-400 leading-relaxed italic line-clamp-3">"{item.description}"</p>
                                <div className="flex justify-between items-end mt-6">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Target Price</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Seller Identity</p>
                                        <p className="text-xs font-black text-cyan-400 uppercase tracking-tight">{item.seller}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button onClick={() => handleCheckout(item)} className="flex-1 py-5 bg-cyan-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    Execute Logistics
                                </Button>
                                <button className="p-5 bg-gray-900 border border-gray-800 rounded-[1.5rem] text-gray-400 hover:text-white transition-all">
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logistics Modal */}
            {checkoutItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-fade-in">
                    <div className="bg-[#0a0a0c] w-full max-w-5xl rounded-[4rem] border border-white/5 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gray-900/40">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-cyan-500/10 rounded-3xl border border-cyan-500/20">
                                    <Truck className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Logistics Pipeline</h3>
                            </div>
                            <button onClick={() => setCheckoutItem(null)} className="p-4 bg-gray-800 rounded-3xl text-white hover:bg-gray-700 transition-colors"><X className="w-6 h-6"/></button>
                        </div>
                        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto custom-scrollbar">
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest border-l-4 border-cyan-500 pl-4 uppercase">Geographical Routing</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {SHIPPING_ZONES.map(zone => (
                                            <button 
                                                key={zone.id} 
                                                onClick={() => setSelectedZone(zone)}
                                                className={`p-6 rounded-[2.5rem] border text-left flex justify-between items-center transition-all ${selectedZone.id === zone.id ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-widest">{zone.name}</span>
                                                <span className="text-3xl">{zone.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-900 p-10 rounded-[4rem] border border-white/5 shadow-inner flex flex-col gap-10">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest text-center uppercase">Final Invoicing</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">Hardware Base</span>
                                            <span className="text-xl font-black text-white">{formatPrice(checkoutItem.price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">Logistics Multiplier</span>
                                            <span className="text-xl font-black text-emerald-400">+{formatPrice(activeShippingQuote)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto space-y-4">
                                    <div className="bg-gray-800/50 p-6 rounded-[2rem] text-center border border-white/5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Grand Deployment Cost</p>
                                        <p className="text-5xl font-black text-white tracking-tighter">{formatPrice(checkoutItem.price + activeShippingQuote + 1)}</p>
                                    </div>
                                    <Button onClick={() => alert("Deployment Initialized.")} className="w-full py-8 bg-cyan-600 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-2xl">
                                        Finalize Transaction
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal */}
            {showSellModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-fade-in">
                    <div className="bg-[#0a0a0c] w-full max-w-2xl rounded-[4rem] border border-white/5 shadow-3xl p-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Gear Commission</h3>
                            <button onClick={() => setShowSellModal(false)} className="p-4 bg-gray-800 rounded-3xl text-white"><X className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Hardware Title</label>
                                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Hardware Model Name..." className="w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl text-white font-black uppercase tracking-tight focus:ring-1 focus:ring-cyan-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Deployment Intelligence (Description)</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Hardware Intel/Condition..." className="w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl text-white font-black h-32 resize-none outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Target Compensation</label>
                                    <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price (USD)..." className="w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl text-white font-black outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Hardware Payload (Grams)</label>
                                    <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Weight..." className="w-full p-6 bg-gray-900 border border-gray-800 rounded-3xl text-white font-black outline-none" />
                                </div>
                            </div>
                            <Button onClick={handleAddListing} className="w-full py-7 bg-cyan-600 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02]">
                                Post to Global Exchange
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
