import React, { useState, useMemo } from 'react';
import { ComboBox, Select, SelectItem, Button } from '@carbon/react';
import { Reset } from '@carbon/icons-react'; // Carbon icon for reset button

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

/** @typedef {{ field: string, dir: 'asc'|'desc', label: string }} SortOption */

/** @type {SortOption[]} */
const SORT_OPTIONS = [
  { value: 'name-asc',    label: 'Name (A → Z)',         field: 'name',        dir: 'asc'  },
  { value: 'name-desc',   label: 'Name (Z → A)',         field: 'name',        dir: 'desc' },
  { value: 'rating-desc', label: 'Rating (high → low)',  field: 'form_rating', dir: 'desc' },
  { value: 'rating-asc',  label: 'Rating (low → high)',  field: 'form_rating', dir: 'asc'  },
  { value: 'age-asc',     label: 'Age (youngest first)', field: 'age',         dir: 'asc'  },
  { value: 'age-desc',    label: 'Age (oldest first)',   field: 'age',         dir: 'desc' },
];

/**
 * @param {{ players: Array<{name: string, position: string, form_rating: number, age: number}>, onSelect: (name: string) => void }} props
 */
function PlayerSelect({ players = [], onSelect }) {
  const [positionFilter, setPositionFilter]         = useState('');
  const [searchQuery, setSearchQuery]               = useState('');
  const [sortValue, setSortValue]                   = useState('name-asc');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');

  // 1. Filter and sort player list dynamically
  const processed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Filter by position
    let list = positionFilter
      ? players.filter((p) => p.position === positionFilter)
      : [...players];

    // Filter by search query
    if (q) {
      list = list.filter((p) => {
        const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
        const nationalityMatch = p.nationality ? p.nationality.toLowerCase().includes(q) : false;
        const citizenshipMatch = p.citizenship ? p.citizenship.toLowerCase().includes(q) : false;
        const clubMatch = p.club ? p.club.toLowerCase().includes(q) : false;

        return nameMatch || nationalityMatch || citizenshipMatch || clubMatch;
      });
    }

    // Sort list
    const opt = SORT_OPTIONS.find((o) => o.value === sortValue) || SORT_OPTIONS[0];
    list.sort((a, b) => {
      const av = a[opt.field] ?? (typeof a[opt.field] === 'string' ? '' : -Infinity);
      const bv = b[opt.field] ?? (typeof b[opt.field] === 'string' ? '' : -Infinity);
      if (av < bv) return opt.dir === 'asc' ? -1 :  1;
      if (av > bv) return opt.dir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [players, positionFilter, searchQuery, sortValue]);

  // Handle player selection
  function handlePlayerSelect(name) {
    setSelectedPlayerName(name);
    onSelect(name);
  }

  // Dynamic reset when position changes
  function handlePositionChange(e) {
    setPositionFilter(e.target.value);
    setSelectedPlayerName('');
    onSelect('');
  }

  // Dynamic reset when sort changes
  function handleSortChange(e) {
    setSortValue(e.target.value);
  }

  // GLOBAL RESET BUTTON ACTION
  function handleResetAll() {
    setPositionFilter('');
    setSearchQuery('');
    setSortValue('name-asc');
    setSelectedPlayerName('');
    onSelect('');
  }

  // Dynamic Key to force ComboBox and Select inputs to re-render when filters reset
  const resetKey = `${positionFilter}::${searchQuery}::${sortValue}::${selectedPlayerName}`;

  return (
    <div className="player-select" key={resetKey}>
      {/* 1. SEARCH WITH AUTO-SUGGEST */}
      <ComboBox
        id="player-search-autosuggest"
        titleText="Search players"
        placeholder="Name, club or nationality…"
        items={processed}
        itemToString={(item) => (item ? item.name : '')}
        onInputChange={(text) => setSearchQuery(text || '')}
        onChange={({ selectedItem }) => {
          if (selectedItem) {
            handlePlayerSelect(selectedItem.name);
          }
        }}
        size="md"
      />

      {/* 2. FILTER BY POSITION */}
      <Select
        id="position-filter"
        labelText="Filter by position"
        value={positionFilter}
        onChange={handlePositionChange}
      >
        <SelectItem value="" text="All positions" />
        {POSITIONS.map((pos) => (
          <SelectItem key={pos} value={pos} text={pos} />
        ))}
      </Select>

      {/* 3. SORT BY */}
      <Select
        id="sort-select"
        labelText="Sort by"
        value={sortValue}
        onChange={handleSortChange}
      >
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} text={opt.label} />
        ))}
      </Select>

      {/* 4. CHOOSE A PLAYER DROPDOWN */}
      <Select
        id="player-select"
        labelText="Choose a player"
        value={selectedPlayerName}
        onChange={(e) => handlePlayerSelect(e.target.value)}
      >
        <SelectItem value="" text={`Select a player… (${processed.length})`} />
        {processed.map((player) => (
          <SelectItem key={player.name} value={player.name} text={player.name} />
        ))}
      </Select>

      {/* 5. RESET BUTTON */}
      <div style={{ marginTop: '1rem' }}>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Reset}
          onClick={handleResetAll}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}

export default PlayerSelect;