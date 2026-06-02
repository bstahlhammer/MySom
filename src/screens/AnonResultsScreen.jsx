import { useMemo, useState, useCallback } from 'react'
import { theme } from '../theme/theme.js'
import { allWines } from '../data/wineDatabase.js'
import { sortWines } from '../engine/sortEngine.js'
import WineCard from '../components/WineCard.jsx'
import SortToggle from '../components/SortToggle.jsx'
import UpsellBanner from '../components/UpsellBanner.jsx'
import BottomNav from '../components/BottomNav.jsx'
import TopBar from '../components/TopBar.jsx'

const PAGE_SIZE = 25

const SORT_OPTIONS = [
  { value: 'crowd',  label: 'Crowd' },
  { value: 'rating', label: 'Rating' },
  { value: 'value',  label: 'Value' },
]

export default function AnonResultsScreen({ navigate, goBack, onWineSelect, tasteProfile, wines: propWines }) {
  const [sortKey, setSortKey]           = useState('crowd')
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const handleSortChange = useCallback(key => {
    setSortKey(key)
    setDisplayCount(PAGE_SIZE)
  }, [])

  const wineSource  = propWines ?? allWines

  const sortedWines = useMemo(
    () => sortWines(wineSource, sortKey, null),
    [sortKey, wineSource]
  )

  const visibleWines = sortedWines.slice(0, displayCount)
  const hasMore      = displayCount < sortedWines.length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.colors.surface }}>
      <div style={{ backgroundColor: theme.colors.brandDark, flexShrink: 0 }}>
        <TopBar onBack={goBack} onHome={() => navigate('home')} light />
        <div style={{ padding: `0 ${theme.spacing.lg} ${theme.spacing.md}` }}>
          <h1 style={{ fontFamily: theme.typography.fontSerif, fontSize: theme.typography.sizes.xxl, color: theme.colors.cream, fontWeight: theme.typography.weights.normal }}>
            Wine List Results
          </h1>
          <p style={{ fontSize: theme.typography.sizes.sm, color: `${theme.colors.cream}80`, fontFamily: theme.typography.fontSans, marginTop: 4 }}>
            {wineSource.length.toLocaleString()} wines · Tap any to explore
          </p>
          <div style={{ marginTop: theme.spacing.md }}>
            <SortToggle options={SORT_OPTIONS} value={sortKey} onChange={handleSortChange} />
          </div>
        </div>
      </div>
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <UpsellBanner onCta={() => navigate('quizIntro')} />
        <div style={{ padding: `0 ${theme.spacing.lg} ${theme.spacing.lg}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {visibleWines.map(wine => (
            <WineCard key={wine.id} wine={wine} personalized={false} onTap={onWineSelect} />
          ))}
          {hasMore && (
            <LoadMoreButton
              shown={displayCount}
              total={sortedWines.length}
              onLoad={() => setDisplayCount(c => Math.min(c + PAGE_SIZE, sortedWines.length))}
            />
          )}
          {!hasMore && sortedWines.length > PAGE_SIZE && (
            <p style={{ textAlign: 'center', fontSize: theme.typography.sizes.sm, color: theme.colors.muted, fontFamily: theme.typography.fontSans, padding: `${theme.spacing.md} 0` }}>
              All {sortedWines.length.toLocaleString()} wines loaded
            </p>
          )}
        </div>
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
