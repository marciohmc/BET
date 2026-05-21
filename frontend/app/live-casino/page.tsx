'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types';
import { api } from '@/lib/api';

export default function LiveCasinoPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: '🎥 All Live' },
    { id: 'roulette', name: '🎡 Roulette' },
    { id: 'blackjack', name: '🃏 Blackjack' },
    { id: 'baccarat', name: '💵 Baccarat' },
    { id: 'game-shows', name: '🎤 Game Shows' },
  ];

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        setIsLoading(true);
        // api.games.getAll can take standard filter/search parameters
        const allGames = await api.games.getAll({ category: 'live-casino' });
        if (Array.isArray(allGames) && allGames.length > 0) {
          setGames(allGames);
        } else {
          // If the database is empty or offline, serve our highly styled default sets
          throw new Error('Using fallback local catalog');
        }
      } catch (err) {
        console.error('Error fetching live casino games:', err);
        setError('Serving offline live games selection.');
        setGames([
          {
            _id: 'lc-1',
            title: 'Lightning Roulette',
            slug: 'lightning-roulette',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'roulette',
            thumbnail: '⚡',
            description: 'Stunning live dealer roulette with high-paying lucky number multipliers.',
            rtp: 97.3,
            volatility: 'high',
            features: ['Live Chat', 'Multipliers', 'Stats Panel'],
            minBet: 0.2,
            maxBet: 5000,
            isPopular: true,
            isNew: false,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: 'lc-2',
            title: 'Crazy Time',
            slug: 'crazy-time',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'game-shows',
            thumbnail: '🎪',
            description: 'The world-famous live game show with 4 interactive bonus games.',
            rtp: 96.08,
            volatility: 'high',
            features: ['Pachinko', 'Cash Hunt', 'Coin Flip', 'Crazy Time Bonus'],
            minBet: 0.1,
            maxBet: 2500,
            isPopular: true,
            isNew: false,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: 'lc-3',
            title: 'Infinite Blackjack',
            slug: 'infinite-blackjack',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'blackjack',
            thumbnail: '🃏',
            description: 'Unlimited seats at this gorgeous standard blackjack table with low bet limits.',
            rtp: 99.47,
            volatility: 'low',
            features: ['Unlimited Seats', '4 Side Bets', 'Six Card Charlie Rule'],
            minBet: 1,
            maxBet: 2000,
            isPopular: true,
            isNew: false,
            isFeatured: false,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: 'lc-4',
            title: 'Peek Baccarat',
            slug: 'peek-baccarat',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'baccarat',
            thumbnail: '🏮',
            description: 'Live elegant baccarat where you can spy on face-down cards to adjust your bet!',
            rtp: 98.8,
            volatility: 'medium',
            features: ['Peek Feature', 'Squeeze Action', 'Live Statistics'],
            minBet: 1,
            maxBet: 10000,
            isPopular: false,
            isNew: true,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: 'lc-5',
            title: 'Monopoly Big Baller',
            slug: 'monopoly-big-baller',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'game-shows',
            thumbnail: '🎩',
            description: 'Action-packed bingo & lottery hybrid live dealer with MR. MONOPOLY!',
            rtp: 96.1,
            volatility: 'high',
            features: ['Live Interactive Board', 'Multipliers', 'Bonus Cards'],
            minBet: 0.1,
            maxBet: 1000,
            isPopular: true,
            isNew: true,
            isFeatured: false,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: 'lc-6',
            title: 'XXXtreme Lightning Roulette',
            slug: 'xxxtreme-lightning-roulette',
            provider: 'Evolution',
            category: 'live-casino',
            subcategory: 'roulette',
            thumbnail: '☄️',
            description: 'More chain lightning and double strikes to unleash multipliers up to 2,000x.',
            rtp: 97.3,
            volatility: 'high',
            features: ['Double Strike Multipliers', 'Chain Lightning', 'Ultra Volatile'],
            minBet: 0.2,
            maxBet: 5000,
            isPopular: false,
            isNew: true,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveGames();
  }, []);

  useEffect(() => {
    let list = [...games];

    // Filter by live subcategory if selected
    if (activeCategory !== 'all') {
      list = list.filter((g) => g.subcategory === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.provider.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query)
      );
    }

    setFilteredGames(list);
  }, [games, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-7xl">
        {/* Banner Section */}
        <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-purple-900 via-pink-900 to-indigo-950 p-8 md:p-12 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl text-center md:text-left z-10">
            <span className="inline-block bg-yellow-400 text-gray-950 font-black text-xs tracking-wider px-3.5 py-1.5 rounded-full mb-4 uppercase">
              🎥 REAL TIME DEALERS
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 mb-4 tracking-tight drop-shadow-md">
              Cassanova Live Casino
            </h1>
            <p className="text-gray-200 text-base md:text-lg mb-6 leading-relaxed">
              Step into the exclusive VIP lounge. Play classic Roulette, Blackjack, and immersive Game Shows streamed in stunning Full HD with professional, real-time dealers!
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center space-x-2 text-sm text-yellow-400 font-bold">
                <span>⚡ Low Latency Streaming</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-emerald-400 font-bold">
                <span>💬 Interativa Live Chat</span>
              </div>
            </div>
          </div>
          {/* Decorative Floating Circle */}
          <div className="text-8xl md:text-9xl animate-pulse select-none filter drop-shadow-[0_0_35px_rgba(234,179,8,0.3)]">
            🎡
          </div>
        </div>

        {/* Filter and Navigation bar */}
        <div className="bg-gray-800/40 backdrop-blur-md rounded-2xl border border-purple-500/20 p-6 mb-10 shadow-xl space-y-6 md:space-y-0 md:flex md:items-center md:justify-between gap-6">
          {/* Categories Slider */}
          <div className="flex flex-wrap gap-2 md:flex-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`py-2 px-4 rounded-xl font-bold transition-all text-sm cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative md:max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search for live roulette, blackjack, game shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-11 pr-4 rounded-xl bg-gray-950 border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* State Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 font-semibold">Broadcasting Live Casino Dealers...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-dashed border-purple-500/10">
            <span className="text-6xl block mb-4">🎥</span>
            <h3 className="text-xl font-bold text-white mb-2">No Live Games Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {"No results matching your keyword. Double-check your search or try another category tab!"}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
            >
              Show All Live Table Games
            </button>
          </div>
        ) : (
          /* Live Game Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredGames.map((game) => (
              <Link
                href={`/games/${game.slug}`}
                key={game._id}
                className="group bg-gray-800/40 hover:bg-gray-800/80 rounded-2xl border border-purple-500/10 hover:border-yellow-400/40 overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full bg-gradient-to-br from-indigo-800 to-indigo-950 flex items-center justify-center overflow-hidden">
                  {game.thumbnail.length <= 4 ? (
                    <span className="text-6xl select-none group-hover:scale-125 transition-transform duration-300">{game.thumbnail}</span>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={game.thumbnail}
                        alt={game.title}
                        fill
                        sizes="(max-w-72) 100vw, 250px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Badges */}
                  <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-full shadow-md select-none flex items-center gap-1.5 leading-none">
                    <span className="block w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE
                  </span>
                  {game.minBet !== undefined && (
                    <span className="absolute bottom-3 right-3 bg-gray-950/80 backdrop-blur-sm text-yellow-400 font-extrabold text-[10px] tracking-wider px-2 py-0.5 rounded shadow-sm">
                      Min: ${game.minBet}
                    </span>
                  )}
                </div>

                {/* Information */}
                <div className="p-4">
                  <h3 className="font-extrabold text-white text-sm mb-1 truncate leading-tight group-hover:text-yellow-400 transition-colors">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{game.provider}</span>
                    <span className="text-emerald-400 font-semibold">{game.rtp}% RTP</span>
                  </div>

                  {/* Play CTA action button */}
                  <div className="mt-4 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white text-center text-xs font-black rounded-xl opacity-90 group-hover:opacity-100 transition-opacity uppercase tracking-wider flex items-center justify-center gap-1">
                    <span>Join Table</span> 🎥
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
