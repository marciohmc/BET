'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function VIPPage() {
  const { user, isAuthenticated } = useAuth();

  const tiers = [
    {
      id: 'bronze',
      name: 'Bronze Club',
      emoji: '🥉',
      badgeColor: 'border-amber-700 text-amber-600 bg-amber-500/10',
      description: 'Your gateway to the elite circle of Cassanova players.',
      minRequirements: 'Starting level upon registration',
      benefits: [
        'Weekly match bonus up to 50%',
        'Access to our Friday Free Spins events',
        'Standard withdrawal processing',
        '24/7 dedicated email customer support',
      ],
      progress: 100,
    },
    {
      id: 'silver',
      name: 'Silver Club',
      emoji: '🥈',
      badgeColor: 'border-slate-400 text-slate-300 bg-slate-400/10',
      description: 'Step up with reduced wagering requirements and boosted reload percentages.',
      minRequirements: '$5,000 Wagered or 500 Loyalty points',
      benefits: [
        'Weekly match bonus up to 75%',
        '10% Weekly Slots loss cashback reward',
        'Priority withdrawal processing (under 12h)',
        'Personal support manager assigned',
      ],
      progress: user?.vipLevel === 'silver' ? 100 : user?.vipLevel === 'gold' || user?.vipLevel === 'platinum' ? 100 : 50,
    },
    {
      id: 'gold',
      name: 'Gold Elite',
      emoji: '🥇',
      badgeColor: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
      description: 'True Cassanova VIP treatment. Generous limits, birthday rewards, and offline gifts.',
      minRequirements: '$25,000 Wagered or 2,500 Loyalty points',
      benefits: [
        'Weekly deposit reload matching up to 100%',
        '15% Slot & Live Table loss cashback weekly',
        'Express payout processing (under 4 hours)',
        'Unlocks direct Telegram/WhatsApp line with VIP representative',
        'Personalized exclusive physical gifts on birthday',
      ],
      progress: user?.vipLevel === 'gold' ? 100 : user?.vipLevel === 'platinum' ? 100 : 15,
    },
    {
      id: 'platinum',
      name: 'Platinum Legend',
      emoji: '👑',
      badgeColor: 'border-purple-400 text-purple-300 bg-purple-500/20',
      description: 'The pinnacle of luxury. Zero restrictions, fully custom offers, and private event passes.',
      minRequirements: 'By Invitation Only (Platinum tier)',
      benefits: [
        'Fully tailormade match bonuses built specifically for you',
        '20% Real Cash lossless cashback returned every Monday',
        'Instantaneous automated withdrawals',
        'No maximum betting or maximum withdrawal caps',
        'Passes to Grand Prix events, luxury cruises, or sport final events',
      ],
      progress: user?.vipLevel === 'platinum' ? 100 : 5,
    },
  ];

  // Helper function to check if this card corresponds to the current tier
  const isCurrentTier = (tierId: string) => {
    if (!isAuthenticated || !user) return tierId === 'bronze';
    return user.vipLevel === tierId;
  };

  const getUserVipInfo = () => {
    if (!isAuthenticated || !user) {
      return {
        levelName: 'Guest Tier',
        progressPercent: 0,
        nextTier: 'Bronze Club (Register to join!)',
      };
    }
    const levelsOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIdx = levelsOrder.indexOf(user.vipLevel);
    const progressMap: Record<string, number> = {
      bronze: 25,
      silver: 55,
      gold: 85,
      platinum: 100,
    };

    return {
      levelName: user.vipLevel.toUpperCase(),
      progressPercent: progressMap[user.vipLevel] || 10,
      nextTier: currentIdx < 3 ? `${levelsOrder[currentIdx + 1].toUpperCase()} Club` : 'Maximum Legend Status',
    };
  };

  const vipInfo = getUserVipInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-6xl">
        {/* Elite Banner Header */}
        <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-gray-900 via-yellow-950 to-purple-950 p-8 md:p-14 border border-yellow-500/30 shadow-2xl text-center md:text-left">
          <div className="max-w-xl z-10 relative">
            <span className="inline-block bg-yellow-400 text-gray-900 font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
              👑 ELITE CLUB MEMBERSHIP
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 mb-4 tracking-tight">
              Cassanova VIP Rewards
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed">
              Earn status on every slot roll or live card dealt. Climb the ranks to unlock faster payouts, elevated cashback percentages, custom deposit bonuses, and luxury VIP access!
            </p>
          </div>
          {/* Decorative floating crown */}
          <div className="absolute top-1/2 -translate-y-1/2 right-12 hidden lg:block text-9xl select-none filter drop-shadow-[0_0_40px_rgba(234,179,8,0.2)] animate-bounce duration-[3000ms]">
            👑
          </div>
        </div>

        {/* User VIP Status Widget */}
        <div className="p-8 rounded-2xl bg-gray-950/60 backdrop-blur-md border border-purple-500/20 mb-12 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="text-sm text-gray-400 block mb-1">YOUR CURRENT MEMBERSHIP STATUS</span>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 uppercase tracking-wider">
                {vipInfo.levelName}
              </h3>
              {!isAuthenticated && (
                <p className="text-sm text-gray-400 mt-2">
                  <Link href="/login" className="text-yellow-400 hover:text-yellow-500 font-bold underline mr-1">Log in</Link> or <Link href="/register" className="text-yellow-400 hover:text-yellow-500 font-bold underline ml-1">register</Link> to start earning points!
                </p>
              )}
            </div>

            {isAuthenticated && (
              <div className="flex-1 max-w-lg w-full">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                  <span>Loyalty Progression</span>
                  <span>Next Rank: <strong className="text-yellow-400">{vipInfo.nextTier}</strong></span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden border border-purple-500/10">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-300 transition-all duration-1000"
                    style={{ width: `${vipInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIP Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => {
            const current = isCurrentTier(tier.id);
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 border transition-all duration-300 flex flex-col justify-between ${
                  current
                    ? 'bg-gradient-to-br from-purple-950 to-gray-900 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.15)] ring-1 ring-yellow-400/40 transform hover:-translate-y-1'
                    : 'bg-gray-800/30 border-purple-500/10 hover:border-purple-500/30 hover:bg-gray-800/40 transform hover:-translate-y-0.5'
                }`}
              >
                {/* Active Status Badge */}
                {current && (
                  <span className="absolute -top-3 right-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider shadow-lg">
                    Current Level
                  </span>
                )}

                <div>
                  {/* Title and Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl select-none">{tier.emoji}</span>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white">{tier.name}</h3>
                      <span className={`inline-block border text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${tier.badgeColor}`}>
                        {tier.id}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Requirements */}
                  <div className="py-2.5 px-4 bg-gray-950/40 rounded-xl mb-6 text-xs text-center border border-purple-500/5">
                    <span className="text-gray-400 mr-2">Target requirement:</span>
                    <strong className="text-white font-bold">{tier.minRequirements}</strong>
                  </div>

                  {/* Benefits checklist */}
                  <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-3">
                    ✨ CLUB PRIVILEGES
                  </h4>
                  <ul className="space-y-3.5 text-sm text-gray-200 mb-8">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold text-base leading-none">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!current && (
                  <div className="pt-4 border-t border-purple-500/10 flex justify-between items-center text-xs text-gray-400">
                    <span>Unlock points required</span>
                    <span className="font-extrabold text-yellow-500 uppercase">Climb Up →</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
