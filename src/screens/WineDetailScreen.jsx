import { theme } from '../theme/theme.js'
import Badge from '../components/Badge.jsx'
import ApproachabilityDots from '../components/ApproachabilityDots.jsx'
import MatchScore from '../components/MatchScore.jsx'
import ScoreBar from '../components/ScoreBar.jsx'
import { computeApproachability } from '../engine/approachabilityEngine.js'

const RATINGS = [
  { emoji: '❤️', label: 'Love it' },
  { emoji: '👍', label: 'Pretty good' },
  { emoji: '🤷', label: 'Not sure' },
  { emoji: '👎', label: 'Not for me' },
]

function palateDescriptor(axis, value) {
  if (axis === 'body')      return value >= 75 ? 'Full' : value >= 50 ? 'Medium' : 'Light'
  if (axis === 'sweetness') return value >= 60 ? 'Sweet' : value >= 35 ? 'Off-dry' : value >= 15 ? 'Dry' : 'Bone dry'
  if (axis === 'tannin')    return value >= 75 ? 'High' : value >= 45 ? 'Medium' : 'Low'
  if (axis === 'acidity')   return value >= 65 ? 'High' : value >= 45 ? 'Medium' : 'Low'
  return ''
}

export default function WineDetailScreen({ goBack, wine, tasteProfile, onRate }) {
  if (!wine) return null

  const approachability = computeApproachability(wine)
  const matchScore = wine.computedMatch ?? wine.match ?? null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.colors.surface }}>
      {/* Top panel */}
      <div style={{ backgroundColor: theme.colors.brandDark, padding: `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.xl}`, flexShrink: 0 }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: `${theme.colors.cream}80`,
            fontSize: theme.typography.sizes.md,
            fontFamily: theme.typography.fontSans,
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Back to results
        </button>

        <h1
          style={{
            fontFamily: theme.typography.fontSerif,
            fontSize: theme.typography.sizes.xxl,
            fontWeight: theme.typography.weights.normal,
            color: theme.colors.cream,
            lineHeight: 1.2,
            marginBottom: theme.spacing.xs,
          }}
        >
          {wine.name}
        </h1>
        <p style={{ fontSize: theme.typography.sizes.sm, color: `${theme.colors.cream}80`, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.md }}>
          {wine.vintage} · {wine.region} · {wine.grape} · {wine.price}
        </p>

        {/* Badge row */}
        <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge variant="critic" label={`${wine.rating} · ${wine.ratingLabel}`} />
          {matchScore !== null && tasteProfile && <MatchScore score={matchScore} />}
          {wine.isCrowd && <Badge variant="crowd" label="Crowd Pleaser" />}
          {wine.isValue && <Badge variant="value" label="Best Value" />}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: theme.spacing.lg }}>
        {/* Tasting notes */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{ fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.medium, color: theme.colors.text, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.sm }}>
            Tasting notes
          </h2>
          <p style={{ fontSize: theme.typography.sizes.md, color: theme.colors.text, fontFamily: theme.typography.fontSans, lineHeight: 1.7, fontStyle: 'italic' }}>
            {wine.tasting}
          </p>
        </section>

        {/* Approachability */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{ fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.medium, color: theme.colors.text, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.sm }}>
            Approachability
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <ApproachabilityDots score={approachability} />
            <span style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted, fontFamily: theme.typography.fontSans }}>
              {approachability >= 5 ? 'Anyone will love it' :
               approachability >= 4 ? 'Broadly approachable' :
               approachability >= 3 ? 'Wine-curious crowd' :
               approachability >= 2 ? 'For wine lovers' :
               'For bold palates only'}
            </span>
          </div>
        </section>

        {/* Why it's a match */}
        {tasteProfile && wine.why && (
          <section style={{ marginBottom: theme.spacing.xl }}>
            <h2 style={{ fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.medium, color: theme.colors.text, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.sm }}>
              Why it's a match for you
            </h2>
            <p style={{ fontSize: theme.typography.sizes.md, color: theme.colors.textMuted, fontFamily: theme.typography.fontSans, lineHeight: 1.7, fontStyle: 'italic' }}>
              {wine.why}
            </p>
          </section>
        )}

        {/* Style profile */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{ fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.medium, color: theme.colors.text, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.md }}>
            Style profile
          </h2>
          <ScoreBar label="Body"      value={wine.body}      descriptor={palateDescriptor('body',      wine.body)} />
          <ScoreBar label="Sweetness" value={wine.sweetness} descriptor={palateDescriptor('sweetness', wine.sweetness)} />
          <ScoreBar label="Tannin"    value={wine.tannin}    descriptor={palateDescriptor('tannin',    wine.tannin)} />
          <ScoreBar label="Acidity"   value={wine.acidity}   descriptor={palateDescriptor('acidity',   wine.acidity)} />
        </section>

        {/* Food pairings */}
        <section style={{ marginBottom: theme.spacing.xxl }}>
          <h2 style={{ fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.medium, color: theme.colors.text, fontFamily: theme.typography.fontSans, marginBottom: theme.spacing.sm }}>
            Food pairings
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {wine.pairings.map(p => (
              <span
                key={p}
                style={{
                  padding: '6px 14px',
                  backgroundColor: theme.colors.barTrack || '#F0E8E0',
                  borderRadius: theme.radius.pill,
                  fontSize: theme.typography.sizes.sm,
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fontSans,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky rating footer */}
      <div
        style={{
          flexShrink: 0,
          borderTop: `0.5px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        }}
      >
        <p style={{ fontSize: theme.typography.sizes.sm, color: theme.colors.textMuted, fontFamily: theme.typography.fontSans, textAlign: 'center', marginBottom: theme.spacing.sm }}>
          How does this land for you?
        </p>
        <div style={{ display: 'flex', gap: theme.spacing.xs }}>
          {RATINGS.map(r => (
            <button
              key={r.label}
              onClick={() => onRate(r.label)}
              style={{
                flex: 1,
                padding: '8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                backgroundColor: 'transparent',
                border: `0.5px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              <span>{r.emoji}</span>
              <span style={{ fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted, fontFamily: theme.typography.fontSans }}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
