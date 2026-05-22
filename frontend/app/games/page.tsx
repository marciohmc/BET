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
        const allGames = await api.games.getAll();
        
        const featuredGames: Game[] = [
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
          }
        ];

        if (Array.isArray(allGames)) {
          // Filtrar se já existir o tiger nos games da API para não duplicar
          const apiGamesFiltered = allGames.filter(g => g.slug !== 'tiger');
          setGames([...featuredGames, ...apiGamesFiltered]);
        } else {
          setGames(featuredGames);
        }
        setError('');
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games data. Showing local featured games.');
        
        // Mantemos os mocks básicos apenas no erro se não houver nada
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
          }
        ]);
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
            <span>💡 {error}</span>
            <button onClick={() => setError('')} className="text-yellow-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Featured Section (Special for Tiger) */}
        {!isLoading && activeCategory === 'all' && searchQuery === '' && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
              <span className="text-yellow-400">🔥</span> FEATURED GAMES
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Link 
                href="/games/tiger"
                className="group relative h-64 rounded-3xl overflow-hidden border border-purple-500/30 bg-[#1a142d] shadow-2xl transition-all hover:border-yellow-400"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-purple-900 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-between p-8">
                  <div className="max-w-xs z-10">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 inline-block">
                      NEW RELEASE
                    </span>
                    <h3 className="text-4xl font-black text-white italic mb-2 tracking-tighter">
                      FORTUNE <span className="text-yellow-400">TIGER</span>
                    </h3>
                    <p className="text-white/80 text-sm font-medium mb-6">
                      The luckiest tiger has arrived! Multiply your wins up to 10x with the Tiger Feature.
                    </p>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl w-fit font-black text-sm group-hover:bg-yellow-400 group-hover:text-black transition-all">
                      PLAY NOW
                    </div>
                  </div>
                  <div className="text-9xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                    🐯
                  </div>
                </div>
              </Link>
              
              {/* Secondary Featured Card Placeholder */}
              <div className="hidden lg:flex flex-col justify-between p-8 rounded-3xl bg-purple-900/10 border border-white/5 opacity-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 text-7xl opacity-10">🎰</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-400">Discover More</h4>
                  <p className="text-gray-500 text-sm mt-1">Explore our latest slot additions and exclusive providers.</p>
                </div>
                <div className="text-gray-600 font-mono text-[10px] tracking-widest mt-8">CASSANOVA EXCLUSIVES</div>
              </div>
            </div>
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
