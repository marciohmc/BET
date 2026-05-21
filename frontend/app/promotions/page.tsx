'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Promotion } from '@/types';
import { api } from '@/lib/api';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'bonus' | 'spins' | 'cashback'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const data = await api.promotions.getAll();
        if (Array.isArray(data)) {
          setPromotions(data);
        } else {
          setPromotions([]);
        }
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setError('Failed to load active promotions. Serving local highlights library.');
        setPromotions([
          {
            _id: '1',
            title: 'Welcome Package',
            slug: 'welcome-package',
            description: 'Get a massive 200% match bonus on your first deposit!',
            type: 'welcome-bonus',
            bonusPercentage: 200,
            maxBonus: 500,
            wageringRequirement: 35,
            validFrom: new Date().toISOString(),
            promoCode: 'WELCOME200',
            terms: 'Minimum deposit is $20. Wagering requirements must be fulfilled before cancellation or withdraw.',
            image: '',
            isActive: true,
            eligibleVipLevels: ['bronze', 'silver', 'gold', 'platinum'],
          },
          {
            _id: '2',
            title: 'Weekly Reload Bonus',
            slug: 'weekly-reload-bonus',
            description: 'Boost your balance dynamically with a 50% reload match up to $250.',
            type: 'reload-bonus',
            bonusPercentage: 50,
            maxBonus: 250,
            wageringRequirement: 30,
            validFrom: new Date().toISOString(),
            promoCode: 'RELOAD50',
            terms: 'Available once per week on any day. Minimum deposit is $10.',
            image: '',
            isActive: true,
            eligibleVipLevels: ['silver', 'gold', 'platinum'],
          },
          {
            _id: '3',
            title: 'Friday Free Spins',
            slug: 'friday-free-spins',
            description: 'Celebrate the weekend with 100 Free Spins on Starburst!',
            type: 'free-spins',
            freeSpins: 100,
            wageringRequirement: 25,
            validFrom: new Date().toISOString(),
            promoCode: 'FRIYAY',
            terms: 'Wagering only applies to free spins winnings. Must be claimed on Fridays.',
            image: '',
            isActive: true,
            eligibleVipLevels: ['bronze', 'silver', 'gold', 'platinum'],
          },
          {
            _id: '4',
            title: 'VIP Cashback Experience',
            slug: 'vip-cashback-experience',
            description: 'Recover up to 20% on weekly slot losses directly into your cash balance.',
            type: 'cashback',
            bonusPercentage: 20,
            wageringRequirement: 1,
            validFrom: new Date().toISOString(),
            terms: 'Only counts slot machines gameplay. Transferred as usable funds directly on Mondays.',
            image: '',
            isActive: true,
            eligibleVipLevels: ['gold', 'platinum'],
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const filteredPromotions = promotions.filter((promo) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'bonus') return promo.type === 'welcome-bonus' || promo.type === 'reload-bonus' || promo.type === 'vip-bonus';
    if (activeTab === 'spins') return promo.type === 'free-spins';
    if (activeTab === 'cashback') return promo.type === 'cashback';
    return true;
  });

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'welcome-bonus': return '🎉';
      case 'reload-bonus': return '💰';
      case 'free-spins': return '🎰';
      case 'cashback': return '💵';
      case 'vip-bonus': return '👑';
      default: return '🎁';
    }
  };

  const getPromoTagColor = (type: string) => {
    switch (type) {
      case 'welcome-bonus': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'reload-bonus': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'free-spins': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cashback': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 mb-4 tracking-tight">
            Exclusive Promotions
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Supercharge your bankroll with daily matches, weekly free spin events, loss cacheback, and premier VIP tier rewards!
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex justify-center flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            🔥 All Offers
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'bonus'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            💰 Match Bonuses
          </button>
          <button
            onClick={() => setActiveTab('spins')}
            className={`py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'spins'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            🎰 Free Spins
          </button>
          <button
            onClick={() => setActiveTab('cashback')}
            className={`py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'cashback'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            💵 Cashback
          </button>
        </div>

        {/* Status notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm flex justify-between items-center">
            <span>💡 {error}</span>
            <button onClick={() => setError('')} className="text-yellow-400 hover:text-white font-bold">×</button>
          </div>
        )}

        {/* Loadings & Lists */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 font-semibold">Loading promotions catalogue...</p>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-dashed border-purple-500/10">
            <span className="text-6xl block mb-4">🎁</span>
            <h3 className="text-xl font-bold text-white mb-2">No Active Promotions</h3>
            <p className="text-gray-400">There are currently no active deals in this section. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPromotions.map((promo) => (
              <div
                key={promo._id}
                className="group flex flex-col bg-gray-800/40 hover:bg-gray-800/80 rounded-2xl border border-purple-500/10 hover:border-yellow-400/40 shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Visual Header Banner */}
                <div className="h-44 relative bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center p-6 text-center select-none overflow-hidden">
                  {promo.image ? (
                    <Image
                      src={promo.image}
                      alt={promo.title}
                      fill
                      className="object-cover opacity-25 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-800/80 to-pink-800/80 border-b border-purple-500/10" />
                  )}

                  <div className="relative z-10">
                    <span className="text-5xl block mb-2">{getPromoIcon(promo.type)}</span>
                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-yellow-300 transition-colors">
                      {promo.title}
                    </h3>
                  </div>
                </div>

                {/* Info and stats info block */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 border rounded-full text-xs font-black uppercase ${getPromoTagColor(promo.type)}`}>
                        {promo.type.replace('-', ' ')}
                      </span>
                      {promo.promoCode && (
                        <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-xs font-black">
                          CODE: {promo.promoCode}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                      {promo.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 py-4 bg-gray-950/40 rounded-xl px-4 border border-purple-500/5 text-center text-xs mb-6">
                      <div>
                        <span className="text-gray-400 block mb-1">Requirement</span>
                        <span className="text-white font-extrabold text-sm">{promo.wageringRequirement}x Roll</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">Min Deposit</span>
                        <span className="text-white font-extrabold text-sm">${promo.minDeposit || 10}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">Max Benefit</span>
                        <span className="text-emerald-400 font-extrabold text-sm">
                          {promo.maxBonus ? `$${promo.maxBonus}` : promo.freeSpins ? `${promo.freeSpins} Spins` : promo.bonusPercentage ? `${promo.bonusPercentage}%` : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-purple-500/10 pt-4">
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                      Ends: {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'Ongoing'}
                    </span>
                    <Link
                      href={`/promotions/${promo.slug}`}
                      className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 text-xs font-extrabold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-md"
                    >
                      CLAIM NOW →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
