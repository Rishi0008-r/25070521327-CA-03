import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import MAJOR_STATIONS from '../data/stations';
import { MapPin, X, Train, ChevronRight } from 'lucide-react';

const StationAutocomplete = ({
  label,
  value = '',
  onChange,
  placeholder = 'Station name or code (e.g. NDLS, Mumbai)',
  iconColor = 'text-indigo-600 dark:text-indigo-400',
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Keep query input in sync with external value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local dataset instantly and fetch remote suggestions in background
  const searchStations = (term) => {
    const q = (term || '').trim().toLowerCase();

    // 1. Instant local filter
    if (!q) {
      // Show top major hubs when empty
      const popular = (MAJOR_STATIONS || []).filter((s) => s.isHub || s.category === 'A1').slice(0, 15);
      setSuggestions(popular.length > 0 ? popular : (MAJOR_STATIONS || []).slice(0, 15));
      setIsOpen(true);
      return;
    }

    const matches = (MAJOR_STATIONS || []).filter((stn) => {
      const code = (stn.code || '').toLowerCase();
      const name = (stn.name || '').toLowerCase();
      const city = (stn.city || '').toLowerCase();
      const state = (stn.state || '').toLowerCase();

      return (
        code.startsWith(q) ||
        code === q ||
        name.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    });

    // Sort: exact code match first, then startsWith, then others
    matches.sort((a, b) => {
      const aCode = (a.code || '').toLowerCase();
      const bCode = (b.code || '').toLowerCase();
      if (aCode === q) return -1;
      if (bCode === q) return 1;
      if (aCode.startsWith(q) && !bCode.startsWith(q)) return -1;
      if (bCode.startsWith(q) && !aCode.startsWith(q)) return 1;
      return 0;
    });

    setSuggestions(matches.slice(0, 20));
    setIsOpen(true);
    setHighlightedIndex(-1);

    // 2. Also query backend API silently for dynamic/DB sync
    api.get(`/trains/stations?query=${encodeURIComponent(term)}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // Merge with deduplication
          const existingCodes = new Set(matches.map((m) => m.code));
          const additions = res.data.filter((s) => !existingCodes.has(s.code));
          if (additions.length > 0) {
            setSuggestions((prev) => [...prev, ...additions].slice(0, 25));
          }
        }
      })
      .catch(() => {
        // Local dataset already handled it
      });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
    searchStations(val);
  };

  const handleSelect = (station) => {
    // Format strictly as "Station Name (CODE)"
    const formatted = `${station.name} (${station.code})`;
    setQuery(formatted);
    if (onChange) onChange(formatted);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    searchStations(query);
  };

  const handleClear = () => {
    setQuery('');
    if (onChange) onChange('');
    searchStations('');
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        searchStations(query);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
          {label}
        </span>
      )}

      <div className="flex items-center relative">
        <MapPin className={`w-4 h-4 ${iconColor} mr-2 shrink-0`} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 pr-6"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            title="Clear station"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Real-Time Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F293D] rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {suggestions.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
              No matching Indian Railway stations found
            </div>
          ) : (
            suggestions.map((stn, index) => {
              const isHighlighted = highlightedIndex === index;
              return (
                <div
                  key={`${stn.code}-${index}`}
                  onClick={() => handleSelect(stn)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-150 ${
                    isHighlighted
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-[#151D30]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40">
                      <Train className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
                        {stn.name} <span className="text-indigo-600 dark:text-indigo-400 font-mono">({stn.code})</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                        {stn.city ? `${stn.city}, ${stn.state}` : stn.state}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                    <div>
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                        {stn.code}
                      </span>
                      {stn.zone && (
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {stn.zone} Zone
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StationAutocomplete;
