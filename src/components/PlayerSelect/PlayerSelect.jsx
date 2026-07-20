import React, { useState, useMemo } from 'react';
import { Search, Select, SelectItem } from '@carbon/react';

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
function PlayerSelect({ players, onSelect }) {
  const [positionFilter, setPositionFilter] = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortValue, setSortValue]           = useState('name-asc');

  const processed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. position filter
    let list = positionFilter
      ? players.filter((p) => p.position === positionFilter)
      : [...players];

    // 2. search filter
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.citizenship  && p.citizenship.toLowerCase().includes(q)) ||
        (p.club         && p.club.toLowerCase().includes(q))
      );
    }

    // 3. sort
    const opt = SORT_OPTIONS.find((o) => o.value === sortValue) || SORT_OPTIONS[0];
    list.sort((a, b) => {
      const av = a[opt.field] ?? (typeof a[opt.field] === 'string' ? '' : -Infinity);
      const bv = b[opt.field] ?? (typeof b[opt.field] === 'string' ? '' : -Infinity);
      if (av < bv) return opt.dir === 'asc' ? -1 :  1;
      if (av > bv) return opt.dir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [players, positionFilter, sortValue]);

  function handlePositionChange(e) {
    setPositionFilter(e.target.value);
    onSelect('');
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    onSelect('');
  }

  function handleSearchClear() {
    setSearchQuery('');
    onSelect('');
  }

  function handleSortChange(e) {
    setSortValue(e.target.value);
    onSelect('');
  }

  function handlePlayerChange(e) {
    onSelect(e.target.value);
  }

  // Reset the player dropdown whenever filter, search, or sort changes
  const playerSelectKey = `${positionFilter}::${searchQuery}::${sortValue}`;

  return (
    <div className="player-select">
      <Search
        id="player-search"
        labelText="Search players"
        placeholder="Name, club or nationality…"
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
        size="md"
      />

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

      <Select
        id="player-select"
        labelText="Choose a player"
        value=""
        key={playerSelectKey}
        onChange={handlePlayerChange}
      >
        <SelectItem value="" text={`Select a player… (${processed.length})`} />
        {processed.map((player) => (
          <SelectItem key={player.name} value={player.name} text={player.name} />
        ))}
      </Select>
    </div>
  );
}

export default PlayerSelect;
