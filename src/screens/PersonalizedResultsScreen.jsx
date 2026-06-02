import { useMemo, useState, useCallback } from 'react'
import { theme } from '../theme/theme.js'
import { allWines } from '../data/wineDatabase.js'
import { sortWines } from '../engine/sortEngine.js'
import WineCard from '../components/WineCard.jsx'
import SortToggle from '../components/SortToggle.jsx'
import BottomNav from '../components/BottomNav.jsx'
import TopBar from '../components/TopBar.jsx'

const PAGE_SIZE = 25

const SORT_OPTIONS = [
  { value: 'match',           label: 'My Match' },
  { value: 'crowd',           label: 'Crowd' },
  { value: 'value',           label: 'Value' },
  { value: 'approachability', label: 'For group' },
]

export default function PersonalizedResultsScreen({ navigate, goBack, tasteProfile, buyingFor, onWineSelect }) {
  const defaultSort = buyingFor === 'group' ? 'approachability' : 'match'
  const [sortKey, setSortKey]           = useState(defaultSort)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const handleSortChange = useCallback(key => {
    setSortKey(key)
    setDisplayCount(PAGE_SIZE)
  }, [])

  const sortedWines = useMemo(
    () => sortWines(allWines, sortKey, tasteProfile),
    [sortKey, tasteProfile]
  )

  const visibleWines = sortedWines.slice(0, displayCount)
  const hasMore      = displayCount < sortedWines.length
  const maxMatch     = Math.max(...sortedWines.slice(0, PAGE_SIZE).map(w => w.computedMatch ?? w.match ?? 0))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.colors.surface }}>
      <div style={{ backgroundColor: theme.colors.brandDark, flexShrink: 0 }}>
        <TopBar onBack={goBack} onHome={() => navigate('home')} light />
        <div style={{ padding: `0 ${theme.spacing.lg} ${theme.spacing.md}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontFamily: theme.typography.fontSerif, fontSize: theme.typography.sizes.xxl, color: theme.colors.cream, fontWeight: theme.typography.weights.normal }}>
                Your matches
              </h1>
              <p style={{ fontSize: theme.typography.sizes.sm, color: `${theme.colors.cream}80`, fontFamily: theme.typography.fontSans, marginTop: 4 }}>
                {sortedWines.length.toLocaleString()} wines · Tap any to explore
              </p>
            </div>
            {tasteProfile && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: `${theme.colors.gold}25`,
                border: `1px solid ${theme.colors.gold}50`,
                borderRadius: theme.radius.pill,
                padding: '4px 10px', maxWidth: 140,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.gold, flexShrink: 0 }} />
                <span style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.gold, fontFamily: theme.typography.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tasteProfile.name.replace('The ', '')}
                </span>
              </div>
            )}
          </div>
          <div style={{ marginTop: theme.spacing.md }}>
            <SortToggle options={SORT_OPTIONS} value={sortKey} onChange={handleSortChange} />
          </div>
        </div>
      </div>
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: `${theme.spacing.md} ${theme.spacing.lg} ${theme.spacing.lg}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        {visibleWines.map(wine => {
          const isBest = (wine.computedMatch ?? wine.match ?? 0) === maxMatch
          return (
            <WineCard key={wine.id} wine={wine} personalized={true} isBestMatch={isBest} onTap={onWineSelect} />
          )
        })}
        {hasMore && (
          <LoadMoreButton
            shown={displayCount}
            total={sortedWines.length}
            onLoad={() => setDisplayCount(c => Math.min(c + PAGE_SIZE, sortedWines.length))}
          />
        )}
        {!hasMore && sortedWines.length > PAGE_SIZE && (
          <AllLoadedNote total={sortedWines.length} />
        )}
      </div>
      <BottomNav activeTab="scan" navigate={navigate} tasteProfile={tasteProfile} />
    </div>
  )
}

function LoadMoreButton({ shown, total, onLoad }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.sm, padding: `${theme.spacing.md} 0` }}>
      <p style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.muted, fontFamily: theme.typography.fontSans }}>
        Showing {shown.toLocaleString()} of {total.toLocaleString()} wines
      </p>
      <button
        onClick={onLoad}
        style={{
          backgroundColor: 'transparent',
          border: `1.5px solid ${theme.colors.brand}`,
          borderRadius: theme.radius.pill,
          padding: '10px 28px',
          color: theme.colors.brand,
          fontFamily: theme.typography.fontSans,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.semibold,
          cursor: 'pointer',
        }}
      >
        Load more
      </button>
    </div>
  )
}

function AllLoadedNote({ total }) {
  return (
    <p style={{ textAlign: 'center', fontSize: theme.typography.sizes.sm, color: theme.colors.muted, fontFamily: theme.typography.fontSans, padding: `${theme.spacing.md} 0` }}>
      All {total.toLocaleString()} wines loaded
    </p>
  )
}
