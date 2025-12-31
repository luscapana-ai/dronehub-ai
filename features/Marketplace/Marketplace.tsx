
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
    ShoppingBag, Tag, Search, PlusCircle, Filter, X, 
    DollarSign, Activity, MessageSquare, Trash, 
    ShieldCheck, Key, Link, Video, Play, AlertCircle, Truck, Shield, Users, FileText, Loader, DollarSign as Cash
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

interface Listing {
    id: string;
    title: string;
    price: number; // Always stored in USD internally
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
    shippingCarrier: 'Standard' | 'Express' | 'Overnight' | 'Local Pickup';
    shippingPrice: number; // Always stored in USD internally
    shippingInsuranceIncluded: boolean;
    shippingCostStrategy: 'Seller' | 'Buyer' | 'Split';
    buyerShippingPercentage: number;
}

const SELLER_FEE_PERCENT = 0.085; // 8.5%
const BUYER_TRANSACTION_FEE_USD = 1.00; // $1.00 USD

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
        shippingCarrier: 'Express',
        shippingPrice: 20,
        shippingInsuranceIncluded: true,
        shippingCostStrategy: 'Split',
        buyerShippingPercentage: 50
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
        shippingCarrier: 'Standard',
        shippingPrice: 10,
        shippingInsuranceIncluded: false,
        shippingCostStrategy: 'Buyer',
        buyerShippingPercentage: 100
    }
];

const CONDITIONS = ['New', 'Mint', 'Good', 'Fair'] as const;
const CARRIERS = ['Standard', 'Express', 'Overnight', 'Local Pickup'] as const;
const DAMAGE_TYPES = ['DOA (Dead on Arrival)', 'Mechanical Failure', 'Cosmetic Damage', 'Incorrect Item', 'Missing Parts'] as const;

export const Marketplace: React.FC = () => {
    const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Drone' | 'Gear' | 'Parts'>('All');
    const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
    
    // Modal & Interaction states
    const [showSellModal, setShowSellModal] = useState(false);
    const [viewVideoUrl, setViewVideoUrl] = useState<string | null>(null);
    const [showDisputeModal, setShowDisputeModal] = useState<Listing | null>(null);
    const [checkoutItem, setCheckoutItem] = useState<Listing | null>(null);
    const [offerItem, setOfferItem] = useState<Listing | null>(null);
    const [offerAmount, setOfferAmount] = useState<string>('');
    const [negotiationPhase, setNegotiationPhase] = useState<'input' | 'processing' | 'result'>('input');
    const [isProcessingDispute, setIsProcessingDispute] = useState(false);
    const [disputeFiledSuccess, setDisputeFiledSuccess] = useState<{ id: string, type: string } | null>(null);
    
    // Form states
    const [newListing, setNewListing] = useState<Partial<Listing>>({
        category: 'Drone',
        condition: 'Good',
        escrowService: 'HubShield',
        price: 0,
        shippingCarrier: 'Standard',
        shippingPrice: 0,
        shippingInsuranceIncluded: false,
        shippingCostStrategy: 'Buyer',
        buyerShippingPercentage: 100
    });
    const [sellerVideo, setSellerVideo] = useState<{file: File, url: string} | null>(null);
    const [disputeVideo, setDisputeVideo] = useState<{file: File, url: string} | null>(null);
    const [disputeDetails, setDisputeDetails] = useState({ type: DAMAGE_TYPES[0], description: '' });

    const formatPrice = (usdAmount: number, targetCurrency: Currency = currency) => {
        const converted = usdAmount * targetCurrency.rate;
        const decimals = targetCurrency.code === 'JPY' ? 0 : 2;
        return `${targetCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    };

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [listings, searchQuery, categoryFilter]);

    const handleCreateListing = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListing.title || !newListing.price || !sellerVideo) {
            alert("Mandatory: Please upload your 20-30s 360-degree verification video to prove product condition.");
            return;
        }

        const priceInUsd = Number(newListing.price) / currency.rate;
        const shippingInUsd = Number(newListing.shippingPrice || 0) / currency.rate;

        const listing: Listing = {
            id: Date.now().toString(),
            title: newListing.title || '',
            price: priceInUsd,
            category: newListing.category as any,
            condition: newListing.condition as any,
            location: newListing.location || 'Unknown',
            description: newListing.description || '',
            seller: 'Me (Pilot)',
            postedAt: 'Just now',
            escrowService: newListing.escrowService as any || 'HubShield',
            verificationVideoUrl: sellerVideo.url,
            shippingCarrier: newListing.shippingCarrier as any,
            shippingPrice: shippingInUsd,
            shippingInsuranceIncluded: !!newListing.shippingInsuranceIncluded,
            shippingCostStrategy: newListing.shippingCostStrategy as any || 'Buyer',
            buyerShippingPercentage: newListing.shippingCostStrategy === 'Split' ? (newListing.buyerShippingPercentage || 50) : (newListing.shippingCostStrategy === 'Buyer' ? 100 : 0)
        };

        setListings([listing, ...listings]);
        setShowSellModal(false);
        setSellerVideo(null);
        setNewListing({ category: 'Drone', condition: 'Good', escrowService: 'HubShield', price: 0 });
    };

    const handleCheckout = (item: Listing) => {
        setCheckoutItem(item);
    };

    const handleMakeOffer = (item: Listing) => {
        setOfferItem(item);
        setOfferAmount((item.price * currency.rate * 0.9).toFixed(0)); // Start at 90%
        setNegotiationPhase('input');
    };

    const submitOffer = () => {
        if (!offerItem || !offerAmount) return;
        setNegotiationPhase('processing');

        // Simulate seller logic
        setTimeout(() => {
            const proposedUsd = Number(offerAmount) / currency.rate;
            const originalUsd = offerItem.price;
            const ratio = proposedUsd / originalUsd;

            let status: Listing['offerStatus'] = 'declined';
            let finalNegotiated = originalUsd;

            if (ratio >= 0.95) {
                status = 'accepted';
                finalNegotiated = proposedUsd;
            } else if (ratio >= 0.85) {
                status = 'countered';
                finalNegotiated = originalUsd * 0.92; // Counter at 92%
            } else {
                status = 'declined';
            }

            setListings(prev => prev.map(l => 
                l.id === offerItem.id 
                    ? { ...l, offerStatus: status, negotiatedPrice: finalNegotiated } 
                    : l
            ));
            
            // Re-fetch the updated item to show result in modal
            const updatedItem = { ...offerItem, offerStatus: status, negotiatedPrice: finalNegotiated };
            setOfferItem(updatedItem);
            setNegotiationPhase('result');
        }, 2000);
    };

    const handleAcceptCounter = () => {
        if (!offerItem) return;
        setListings(prev => prev.map(l => 
            l.id === offerItem.id 
                ? { ...l, offerStatus: 'accepted' } 
                : l
        ));
        setOfferItem(null);
        alert("Counter-offer accepted! You can now checkout at the new price.");
    };

    const handleFileDispute = () => {
        if (!disputeVideo) {
            alert("Required: You must upload a video of the damaged product to support your claim.");
            return;
        }
        if (!disputeDetails.description.trim()) {
            alert("Required: Please provide a description of the issue.");
            return;
        }
        
        setIsProcessingDispute(true);
        setTimeout(() => {
            const caseId = `HS-${Math.floor(100000 + Math.random() * 900000)}`;
            setDisputeFiledSuccess({ id: caseId, type: disputeDetails.type });
            setIsProcessingDispute(false);
            setTimeout(() => {
                setDisputeFiledSuccess(null);
                setShowDisputeModal(null);
                setDisputeVideo(null);
                setDisputeDetails({ type: DAMAGE_TYPES[0], description: '' });
            }, 6000);
        }, 3500);
    };

    const confirmPurchase = () => {
        if (!checkoutItem) return;
        alert(`Transaction Secured! Funds held in escrow until you verify arrival.`);
        setCheckoutItem(null);
    };

    const sellerPayoutUsd = useMemo(() => {
        const price = newListing.price || 0;
        const priceUsd = price / currency.rate;
        const platformFeeUsd = priceUsd * SELLER_FEE_PERCENT;
        const shippingPriceUsd = (newListing.shippingPrice || 0) / currency.rate;
        const buyerPercentage = newListing.shippingCostStrategy === 'Split' ? (newListing.buyerShippingPercentage || 50) : (newListing.shippingCostStrategy === 'Buyer' ? 100 : 0);
        const sellerShippingDebitUsd = shippingPriceUsd * ((100 - buyerPercentage) / 100);
        return priceUsd - platformFeeUsd - sellerShippingDebitUsd;
    }, [newListing, currency]);

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 p-2 lg:p-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/30 p-6 rounded-3xl border border-gray-800 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                        <ShoppingBag className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Hub Exchange</h2>
                        <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                            <span className="flex items-center gap-1 text-emerald-400/80"><ShieldCheck className="w-3 h-3"/> Secured</span>
                            <div className="h-4 w-px bg-gray-700 mx-1"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Region:</span>
                                <select 
                                    value={currency.code} 
                                    onChange={(e) => setCurrency(SUPPORTED_CURRENCIES.find(c => c.code === e.target.value) || SUPPORTED_CURRENCIES[0])}
                                    className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-0.5 text-cyan-400 focus:outline-none"
                                >
                                    {SUPPORTED_CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <Button 
                    onClick={() => setShowSellModal(true)} 
                    className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-cyan-900/20"
                >
                    <PlusCircle className="w-5 h-5 mr-3" />
                    Post Gear
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-6 space-y-6 bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-800 shadow-xl">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Search Hub</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Model, part..." className="w-full p-2.5 pl-9 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white" />
                            </div>
                        </div>
                        <div className="bg-emerald-500/5 rounded-3xl p-5 border border-emerald-500/10 space-y-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Global Escrow</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">"Our escrow supports multiple currencies and insured global logistics."</p>
                        </div>
                    </div>
                </aside>

                {/* Grid */}
                <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredListings.map(item => (
                            <div key={item.id} className="group bg-gray-800 rounded-[3rem] border border-gray-700/50 overflow-hidden flex flex-col hover:border-cyan-500 transition-all duration-300 relative">
                                <div className="aspect-[1.4] bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                                        <button 
                                            onClick={() => setViewVideoUrl(item.verificationVideoUrl!)}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-white p-2.5 rounded-full shadow-2xl border border-white/20 flex items-center justify-center group/vid"
                                        >
                                            <Video className="w-4 h-4" />
                                            <span className="max-w-0 overflow-hidden group-hover/vid:max-w-xs transition-all duration-300 text-[9px] font-black uppercase tracking-widest pl-0 group-hover/vid:pl-2">Watch Proof</span>
                                        </button>
                                    </div>
                                    <Activity className="w-16 h-16 text-gray-800 opacity-20" />
                                    <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
                                        {item.offerStatus === 'accepted' && (
                                            <div className="bg-emerald-500 text-white font-black px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest shadow-xl animate-pulse self-start">
                                                Negotiated Price
                                            </div>
                                        )}
                                        <div className="bg-white text-gray-900 font-black px-4 py-2 rounded-xl text-xl shadow-2xl">
                                            {formatPrice(item.offerStatus === 'accepted' && item.negotiatedPrice ? item.negotiatedPrice : item.price)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-white leading-tight">{item.title}</h3>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-md border uppercase ${item.offerStatus === 'accepted' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-500 bg-gray-700/30 border-gray-700'}`}>
                                            {item.offerStatus === 'accepted' ? 'Deal Ready' : item.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs mb-4 flex-1">"{item.description}"</p>
                                    
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleCheckout(item)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-cyan-600 shadow-xl shadow-cyan-900/20">
                                            {item.offerStatus === 'accepted' ? 'Pay Escrow' : 'Checkout'}
                                        </Button>
                                        {!item.offerStatus || item.offerStatus === 'declined' || item.offerStatus === 'countered' ? (
                                            <Button 
                                                variant="secondary"
                                                onClick={() => handleMakeOffer(item)}
                                                className="px-4 py-3 rounded-2xl hover:bg-cyan-500/10 text-cyan-400 transition-all"
                                                title="Make Best Offer"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                            </Button>
                                        ) : null}
                                        <Button 
                                            variant="secondary"
                                            onClick={() => setShowDisputeModal(item)}
                                            className="px-4 py-3 rounded-2xl hover:bg-red-900/30 text-red-400 transition-all"
                                            title="Report Damage"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Negotiation / Best Offer Modal */}
            {offerItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-gray-800 w-full max-w-xl rounded-[3rem] border border-gray-700 shadow-3xl overflow-hidden animate-fade-in relative">
                        <div className="p-8 border-b border-gray-700/50 flex justify-between items-center bg-cyan-500/5">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Negotiate Intel</h3>
                                <p className="text-[10px] text-cyan-400/80 mt-1 uppercase tracking-widest font-bold">Best Offer Pipeline</p>
                            </div>
                            <button onClick={() => setOfferItem(null)} className="p-3 bg-gray-700 rounded-2xl text-white hover:bg-gray-600 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {negotiationPhase === 'input' && (
                                <>
                                    <div className="space-y-4">
                                        <div className="bg-gray-900/80 p-6 rounded-[2rem] border border-gray-700 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Asking Price</span>
                                            <span className="text-xl font-black text-white">{formatPrice(offerItem.price)}</span>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Your Proximity Bid ({currency.code})</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={offerAmount} 
                                                    onChange={(e) => setOfferAmount(e.target.value)}
                                                    className="w-full p-6 bg-gray-900 border border-gray-700 rounded-[2rem] text-4xl font-black text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-center"
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xl">{currency.symbol}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={submitOffer} className="w-full py-6 rounded-[2rem] bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-[0.4em]">Transmit Offer</Button>
                                </>
                            )}

                            {negotiationPhase === 'processing' && (
                                <div className="py-12 flex flex-col items-center text-center gap-6">
                                    <Loader className="w-12 h-12 text-cyan-400 animate-spin" />
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-widest">Evaluating Offer</h4>
                                        <p className="text-[10px] text-gray-500 uppercase mt-2">Seller is reviewing your transmission...</p>
                                    </div>
                                </div>
                            )}

                            {negotiationPhase === 'result' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className={`p-8 rounded-[2.5rem] border flex flex-col items-center text-center gap-4 ${
                                        offerItem.offerStatus === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                        offerItem.offerStatus === 'countered' ? 'bg-cyan-500/10 border-cyan-500/30' :
                                        'bg-red-500/10 border-red-500/30'
                                    }`}>
                                        {offerItem.offerStatus === 'accepted' ? (
                                            <>
                                                <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-400"><ShieldCheck className="w-10 h-10"/></div>
                                                <h4 className="text-xl font-black text-white uppercase">Offer Accepted!</h4>
                                                <p className="text-[10px] text-gray-400 uppercase leading-relaxed">The seller agreed to your bid. Secure the asset now.</p>
                                            </>
                                        ) : offerItem.offerStatus === 'countered' ? (
                                            <>
                                                <div className="p-4 bg-cyan-500/20 rounded-full text-cyan-400"><MessageSquare className="w-10 h-10"/></div>
                                                <h4 className="text-xl font-black text-white uppercase">Counter Transmission</h4>
                                                <p className="text-[10px] text-gray-400 uppercase leading-relaxed">The seller wasn't ready for that low. They countered with:</p>
                                                <div className="text-4xl font-black text-cyan-400">{formatPrice(offerItem.negotiatedPrice || 0)}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-red-500/20 rounded-full text-red-400"><X className="w-10 h-10"/></div>
                                                <h4 className="text-xl font-black text-white uppercase">Offer Declined</h4>
                                                <p className="text-[10px] text-gray-400 uppercase leading-relaxed">The seller rejected your transmission. Try a more competitive bid.</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        {offerItem.offerStatus === 'countered' ? (
                                            <>
                                                <Button onClick={handleAcceptCounter} className="flex-1 py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest">Accept Counter</Button>
                                                <Button variant="secondary" onClick={() => setNegotiationPhase('input')} className="flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest">New Bid</Button>
                                            </>
                                        ) : (
                                            <Button onClick={() => setOfferItem(null)} className="w-full py-5 rounded-[2rem] bg-gray-700 hover:bg-gray-600 text-[10px] font-black uppercase tracking-widest">Continue Browsing</Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Proof Viewer */}
            {viewVideoUrl && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <video src={viewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
                        <button onClick={() => setViewVideoUrl(null)} className="absolute top-6 right-6 bg-gray-800/80 p-4 rounded-full text-white hover:bg-gray-700 transition-colors"><X className="w-6 h-6"/></button>
                        <div className="absolute bottom-6 left-6 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4"/> Pre-Shipment Proof
                        </div>
                    </div>
                </div>
            )}

            {/* Buyer Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-gray-800 w-full max-w-2xl rounded-[3rem] border border-red-500/30 shadow-2xl overflow-hidden animate-fade-in relative">
                        {isProcessingDispute && (
                            <div className="absolute inset-0 z-[60] bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 animate-fade-in">
                                <Loader className="w-12 h-12 text-cyan-400 mb-6 animate-spin" />
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Analyzing Evidence</h3>
                                <p className="text-gray-400 text-xs max-w-xs">HubShield AI is scanning for structural anomalies and mechanical failures. Please wait...</p>
                                <div className="w-48 h-1 bg-gray-700 rounded-full mt-6 overflow-hidden">
                                    <div className="h-full bg-cyan-500 animate-[loading_3s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                        )}

                        {disputeFiledSuccess && (
                            <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10 animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Dispute Lodged</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="inline-block px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl">
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Case ID</p>
                                        <p className="text-lg font-black text-cyan-400">{disputeFiledSuccess.id}</p>
                                    </div>
                                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                        Evidence of <span className="text-white font-bold">{disputeFiledSuccess.type}</span> has been logged. Escrow funds are now <span className="text-red-400 font-bold underline">Frozen</span> pending resolution.
                                    </p>
                                </div>
                                <Button onClick={() => setShowDisputeModal(null)} variant="secondary" className="px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest">Close Pipeline</Button>
                            </div>
                        )}
                        
                        <div className="p-8 border-b border-gray-700/50 flex justify-between items-center bg-red-500/5">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Buyer Dispute Intake</h3>
                                <p className="text-[10px] text-red-400/80 mt-1 uppercase tracking-widest font-bold">Item Condition Conflict Resolution</p>
                            </div>
                            <button onClick={() => setShowDisputeModal(null)} className="p-3 bg-gray-700 rounded-2xl text-white hover:bg-gray-600 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-red-400 uppercase tracking-widest border-l-4 border-red-500 pl-3 leading-none">Evidence Upload</h4>
                                    <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 transition-all hover:border-red-500/50 min-h-[220px]">
                                        {!disputeVideo ? (
                                            <>
                                                <div className="p-5 bg-red-500/10 rounded-full">
                                                    <Video className="w-8 h-8 text-red-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Condition Intelligence Proof</p>
                                                    <p className="text-[9px] text-gray-500 uppercase font-black">20-30s detailed sweep required</p>
                                                </div>
                                                <Button variant="secondary" onClick={() => (document.getElementById('dispute-vid') as HTMLInputElement).click()} className="text-[9px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl border-red-500/20">Select Evidence</Button>
                                                <input type="file" id="dispute-vid" accept="video/*" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) setDisputeVideo({ file: f, url: URL.createObjectURL(f) });
                                                }} className="hidden" />
                                            </>
                                        ) : (
                                            <div className="w-full flex flex-col items-center gap-4">
                                                <div className="relative rounded-2xl overflow-hidden border border-red-500/30">
                                                    <video src={disputeVideo.url} className="max-h-32" />
                                                    <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><AlertCircle className="w-3 h-3"/></div>
                                                </div>
                                                <button type="button" onClick={() => setDisputeVideo(null)} className="text-red-400 text-[10px] font-black uppercase hover:underline">Replace Evidence</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-gray-600 pl-3 leading-none">Issue Description</h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Failure</label>
                                            <select 
                                                value={disputeDetails.type}
                                                onChange={(e) => setDisputeDetails({...disputeDetails, type: e.target.value as any})}
                                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-2xl text-white font-bold text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                                            >
                                                {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Observations</label>
                                            <textarea 
                                                required
                                                value={disputeDetails.description}
                                                onChange={(e) => setDisputeDetails({...disputeDetails, description: e.target.value})}
                                                rows={4}
                                                placeholder="Explain what's wrong with the item upon arrival..."
                                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-2xl text-white text-xs focus:ring-1 focus:ring-red-500 focus:outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-700/50">
                                <Button 
                                    onClick={handleFileDispute} 
                                    disabled={isProcessingDispute}
                                    className="w-full py-5 rounded-[2rem] bg-red-600 hover:bg-red-500 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-red-900/30"
                                >
                                    Finalize Damage Claim
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-gray-800 w-full max-w-lg rounded-[3.5rem] border border-gray-700 shadow-3xl overflow-hidden animate-fade-in transform">
                        <div className="p-10 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/50">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Finalize Intel</h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Escrow Secure Pipeline</p>
                            </div>
                            <button onClick={() => setCheckoutItem(null)} className="p-3 bg-gray-700 rounded-2xl text-white hover:bg-gray-600 transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-10 space-y-8">
                            <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-gray-700/50 space-y-4 shadow-inner">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Item Subtotal</span>
                                    <span className="text-white font-black">{formatPrice(checkoutItem.offerStatus === 'accepted' && checkoutItem.negotiatedPrice ? checkoutItem.negotiatedPrice : checkoutItem.price)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Posting Share</span>
                                    <span className="text-white font-black">
                                        {formatPrice(checkoutItem.shippingPrice * (checkoutItem.buyerShippingPercentage / 100))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Service Fee</span>
                                    <span className="text-white font-black">{formatPrice(BUYER_TRANSACTION_FEE_USD)}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700/50 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total to Escrow</p>
                                    <p className="text-4xl font-black text-white tracking-tighter">
                                        {formatPrice(
                                            (checkoutItem.offerStatus === 'accepted' && checkoutItem.negotiatedPrice ? checkoutItem.negotiatedPrice : checkoutItem.price) + 
                                            (checkoutItem.shippingPrice * (checkoutItem.buyerShippingPercentage / 100)) + 
                                            BUYER_TRANSACTION_FEE_USD
                                        )}
                                    </p>
                                </div>
                                <Button onClick={confirmPurchase} className="px-10 py-5 rounded-3xl bg-cyan-600 hover:bg-cyan-500 text-xs font-black uppercase tracking-[0.3em] shadow-lg shadow-cyan-900/40">
                                    Arm Payment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal */}
            {showSellModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                    <div className="bg-gray-800 w-full max-w-4xl rounded-[4rem] border border-gray-700 my-8 overflow-hidden transform relative shadow-3xl animate-fade-in">
                        <div className="p-10 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/50 sticky top-0 z-20 backdrop-blur-md">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Post Hardware</h3>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Pricing in {currency.code}</p>
                            </div>
                            <button onClick={() => setShowSellModal(false)} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-3xl text-gray-300 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={handleCreateListing} className="p-10 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest border-l-4 border-cyan-500 pl-3 leading-none">Condition Intelligence</h4>
                                    <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-4 group hover:border-cyan-500 transition-all shadow-inner">
                                        {!sellerVideo ? (
                                            <>
                                                <div className="p-6 bg-cyan-500/10 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                                                    <Video className="w-12 h-12 text-cyan-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Record 20-30s 360° Rotation</p>
                                                    <p className="text-[9px] text-gray-500 uppercase font-black">Proof of zero damage MANDATORY</p>
                                                </div>
                                                <Button type="button" variant="secondary" onClick={() => (document.getElementById('video-input') as HTMLInputElement).click()} className="text-[9px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Upload Video Proof</Button>
                                                <input type="file" id="video-input" accept="video/*" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) setSellerVideo({ file: f, url: URL.createObjectURL(f) });
                                                }} className="hidden" />
                                            </>
                                        ) : (
                                            <div className="w-full flex flex-col items-center gap-4">
                                                <div className="relative rounded-[2rem] overflow-hidden border border-emerald-500/30 shadow-2xl">
                                                    <video src={sellerVideo.url} className="max-h-48" />
                                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full"><ShieldCheck className="w-4 h-4"/></div>
                                                </div>
                                                <button type="button" onClick={() => setSellerVideo(null)} className="text-red-400 text-[10px] font-black uppercase hover:underline">Reset Proof Video</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Detailed Specs</label>
                                        <textarea required value={newListing.description || ''} onChange={e => setNewListing({...newListing, description: e.target.value})} rows={4} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-3xl text-white font-medium text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all shadow-inner" placeholder="Components, history, repairs..."></textarea>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3 leading-none">Market Strategy</h4>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Target Price ({currency.symbol})</label>
                                            <input type="number" required value={newListing.price || ''} onChange={e => setNewListing({...newListing, price: Number(e.target.value)})} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black text-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner" />
                                        </div>
                                        
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Shipping Cost Allocation</label>
                                            <div className="grid grid-cols-3 gap-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-700 shadow-inner">
                                                {(['Seller', 'Buyer', 'Split'] as const).map(strat => (
                                                    <button
                                                        key={strat}
                                                        type="button"
                                                        onClick={() => {
                                                            const buyerPct = strat === 'Buyer' ? 100 : (strat === 'Split' ? 50 : 0);
                                                            setNewListing({...newListing, shippingCostStrategy: strat, buyerShippingPercentage: buyerPct});
                                                        }}
                                                        className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${newListing.shippingCostStrategy === strat ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                                    >
                                                        {strat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Carrier</label>
                                            <select value={newListing.shippingCarrier} onChange={e => setNewListing({...newListing, shippingCarrier: e.target.value as any})} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-3xl text-white font-bold text-xs appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner cursor-pointer">
                                                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Total Post ({currency.symbol})</label>
                                            <input type="number" required value={newListing.shippingPrice || ''} onChange={e => setNewListing({...newListing, shippingPrice: Number(e.target.value)})} className="w-full p-5 bg-gray-900 border border-gray-700 rounded-3xl text-white font-black text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner" />
                                        </div>
                                    </div>

                                    <div className="bg-gray-900/50 p-8 rounded-[3rem] border border-gray-700/50 space-y-4 shadow-2xl">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest leading-none">Estimated Payout</span>
                                            <span className="text-3xl font-black text-emerald-400 tracking-tighter leading-none">{formatPrice(sellerPayoutUsd)}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-500 italic text-right leading-none uppercase font-bold tracking-widest">Includes 8.5% fee + your share of logistics</p>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.6em] text-xs bg-cyan-600 hover:bg-cyan-500 shadow-3xl shadow-cyan-900/30 transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                Secure Listing & Proof
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
