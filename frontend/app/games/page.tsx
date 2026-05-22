'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Game } from '@/types';
import { api } from '@/lib/api';

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: '🎮 All Games' },
    { id: 'slots', name: '🎰 Slots' },
    { id: 'table-games', name: '🃏 Table Games' },
    { id: 'live-casino', name: '⚡ Live Casino' },
    { id: 'video-poker', name: '🃏 Video Poker' },
    { id: 'specialty', name: '🔮 Specialty' },
    { id: 'jackpots', name: '💰 Jackpots' },
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        // api.games.getAll takes an optional params object
        const allGames = await api.games.getAll();
        if (Array.isArray(allGames)) {
          setGames(allGames);
        } else {
          // If the API returns something else, write fallback or empty array
          setGames([]);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games data. Please try again.');
        // Fallback fake/mock lists to make the page functional even if backend is offline or loading
        setGames([
          {
            _id: 'tiger-id',
            title: 'Fortune Tiger',
            slug: 'tiger',
            provider: 'G-Machine',
            category: 'slots',
            thumbnail: '🐯',
            description: 'The luckiest tiger in the casino!',
            rtp: 96.8,
            volatility: 'high',
            features: ['Wilds', 'Multipliers'],
            minBet: 0.5,
            maxBet: 500,
            isPopular: true,
            isNew: true,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: true,
            launchUrl: '/games/tiger',
          },
          {
            _id: '1',
            title: 'Mega Fortune',
            slug: 'mega-fortune',
            provider: 'NetEnt',
            category: 'slots',
            thumbnail: '🎰',
            description: 'A luxurious slot with massive progressive jackpots.',
            rtp: 96.6,
            volatility: 'medium',
            features: ['Free Spins', 'Bonus Game'],
            minBet: 0.25,
            maxBet: 50,
            isPopular: true,
            isNew: false,
            isFeatured: true,
            hasJackpot: true,
            jackpotAmount: 1450000,
            demoAvailable: true,
            launchUrl: '',
          },
          {
            _id: '2',
            title: 'Book of Dead',
            slug: 'book-of-dead',
            provider: 'Play\'n GO',
            category: 'slots',
            thumbnail: '📚',
            description: 'An ancient Egyptian adventure with expanding symbols.',
            rtp: 96.2,
            volatility: 'high',
            features: ['Expanding Symbols', 'Free Spins'],
            minBet: 0.1,
            maxBet: 100,
            isPopular: true,
            isNew: false,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: true,
            launchUrl: '',
          },
          {
            _id: '3',
            title: 'Starburst',
            slug: 'starburst',
            provider: 'NetEnt',
            category: 'slots',
            thumbnail: '⭐',
            description: 'A vibrant universe featuring arcade-style reels and wild symbols.',
            rtp: 96.1,
            volatility: 'low',
            features: ['Wilds', 'Respins'],
            minBet: 0.1,
            maxBet: 100,
            isPopular: true,
            isNew: false,
            isFeatured: false,
            hasJackpot: false,
            demoAvailable: true,
            launchUrl: '',
          },
          {
            _id: '4',
            title: 'Lightning Roulette',
            slug: 'lightning-roulette',
            provider: 'Evolution',
            category: 'live-casino',
            thumbnail: '⚡',
            description: 'Enhanced Live Roulette with lucky numbers and high multipliers.',
            rtp: 97.3,
            volatility: 'high',
            features: ['Multipliers', 'Live Dealer'],
            minBet: 0.5,
            maxBet: 5000,
            isPopular: true,
            isNew: true,
            isFeatured: true,
            hasJackpot: false,
            demoAvailable: false,
            launchUrl: '',
          },
          {
            _id: '5',
            title: 'Blackjack Classic',
            slug: 'blackjack-classic',
            provider: 'Evolution',
            category: 'table-games',
            thumbnail: '🃏',
            description: 'Traditional multi-hand professional Blackjack table.',
            rtp: 99.5,
            volatility: 'low',
            features: ['Insurance', 'Double Down'],
            minBet: 1,
            maxBet: 1000,
            isPopular: false,
            isNew: false,
            isFeatured: false,
            hasJackpot: false,
            demoAvailable: true,
            launchUrl: '',
          },
          {
            _id: '6',
            title: 'Mega Moolah',
            slug: 'mega-moolah',
            provider: 'Microgaming',
            category: 'slots',
            thumbnail: '🦁',
            description: 'The premier safari-themed mega progressive jackpot wheel.',
            rtp: 88.1,
            volatility: 'high',
            features: ['Jackpot Wheel', 'Free Spins'],
            minBet: 0.25,
            maxBet: 6,
            isPopular: true,
            isNew: false,
            isFeatured: true,
            hasJackpot: true,
            jackpotAmount: 3840120,
            demoAvailable: true,
            launchUrl: '',
          }
        ]);
        setError('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    let list = [...games];

    // Filter by category
    if (activeCategory !== 'all') {
      if (activeCategory === 'jackpots') {
        list = list.filter((g) => g.hasJackpot);
      } else {
        list = list.filter((g) => g.category === activeCategory);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 mb-4 tracking-tight drop-shadow-sm">
            Cassanova Game Lobby
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Explore 1,000+ top slots, dynamic table games, live dealers, and life-changing jackpots!
          </p>
        </div>

        {/* Search and Navigation Bar */}
        <div className="bg-gray-800/40 backdrop-blur-md rounded-2xl border border-purple-500/20 p-6 mb-10 shadow-xl space-y-6 md:space-y-0 md:flex md:items-center md:justify-between gap-6">
          {/* Categories Slider/Tabs */}
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

          {/* Search Bar */}
          <div className="relative md:max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search for slots, providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-11 pr-4 rounded-xl bg-gray-950 border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Error notification (if any) */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm flex justify-between items-center">
            <span>💡 {error} (Serving local cached games library)</span>
            <button onClick={() => setError('')} className="text-yellow-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Game State Displays */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 font-semibold">Loading Cassanova Games Lobby...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-dashed border-purple-500/10">
            <span className="text-6xl block mb-4">🎰</span>
            <h3 className="text-xl font-bold text-white mb-2">No Games Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {"We couldn't find any games matching your current selection. Try resetting filters or search query!"}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Game Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredGames.map((game) => (
              <Link
                href={`/games/${game.slug}`}
                key={game._id}
                className="group bg-gray-800/40 hover:bg-gray-800/80 rounded-2xl border border-purple-500/10 hover:border-yellow-400/40 overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image / Thumbnail Container */}
                <div className="relative aspect-square w-full bg-gradient-to-br from-purple-800 to-pink-700 flex items-center justify-center overflow-hidden">
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
                  {game.isNew && (
                    <span className="absolute top-3 left-3 bg-purple-600 text-white font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-full shadow-md select-none">
                      NEW
                    </span>
                  )}
                  {game.hasJackpot && (
                    <span className="absolute top-3 right-3 bg-yellow-400 text-gray-950 font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-full shadow-md select-none">
                      JACKPOT
                    </span>
                  )}
                </div>

                {/* Info block */}
                <div className="p-4">
                  <h3 className="font-extrabold text-white text-sm mb-1 truncate leading-tight group-hover:text-yellow-400 transition-colors">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{game.provider}</span>
                    <span className="text-emerald-400 font-semibold">{game.rtp}% RTP</span>
                  </div>

                  {/* Jackpot highlight (if exists) */}
                  {game.hasJackpot && game.jackpotAmount && (
                    <div className="mt-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold text-center rounded-lg">
                      ${game.jackpotAmount.toLocaleString()}
                    </div>
                  )}

                  <div className="mt-4 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-950 text-center text-xs font-black rounded-xl opacity-90 group-hover:opacity-100 transition-opacity">
                    PLAY NOW
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
