import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { DedupPanel } from '@/components/data-curation/dedup-panel'
import { DocCard } from '@/components/data-curation/doc-card'
import { FilterPanel } from '@/components/data-curation/filter-panel'
import { FunnelPanel } from '@/components/data-curation/funnel-panel'
import {
  DEFAULT_FILTERS,
  DOCS,
  dedup,
  rejectReasons,
  totalTokens,
} from '@/components/data-curation/model'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'

export const Route = createFileRoute('/learn/data-curation')({
  head: () => ({ meta: [{ title: 'Data curation, interactively · Roadmap to Mastery' }] }),
  component: DataCurationPage,
})

function DataCurationPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [dedupT, setDedupT] = useState(0.8)

  const filtered = DOCS.filter((d) => rejectReasons(d, filters).length === 0)
  const result = dedup(filtered, dedupT)

  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Interactive explainer ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '3' }} className="hover:underline">
            Phase 3 — Training &amp; systems
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Data
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Architecture gets the papers; <strong>data gets the results</strong>. Nobody can read a
          trillion tokens, so the real work of pretraining is building filters that read them for
          you — and the field keeps rediscovering that a small model on deliberately curated data
          beats a bigger one on sludge. Below is a fourteen-document "web crawl" small enough to
          check every decision by eye, run through the real algorithms.
        </p>
        <p className="rise rise-3 mt-4 font-mono text-[0.7rem] text-ink-faint">
          raw crawl → quality filters → deduplication → training mix — the pipeline nobody
          screenshots, and the biggest lever you own.
        </p>
      </div>

      {/* ── §1 the raw crawl ─────────────────────────────────── */}
      <Section label="§ 1 · The raw crawl" title="What the internet actually looks like">
        <p className="prose-note mb-8 max-w-2xl">
          Five documents of honest prose are in here — alongside navigation boilerplate, SEO keyword
          stuffing, code noise, a useless fragment, and the same bird story <em>five times</em> (two
          byte-identical copies, two lightly reworded). Real crawls run about this dirty. Skim them;
          the next two sections will find the junk without reading.
        </p>
        <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {DOCS.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
          <p className="mt-4 border-paper-edge border-t pt-3 font-mono text-ink-faint text-xs">
            {DOCS.length} documents · {totalTokens(DOCS)} tokens, uncurated
          </p>
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 quality filters ───────────────────────────────── */}
      <Section label="§ 2 · Quality filters" title="Heuristics read the data so you can't have to">
        <p className="prose-note mb-8 max-w-2xl">
          Five statistics, five thresholds — each one computed live on every document. The defaults
          catch exactly the junk. Now <strong>loosen one and watch it sneak back in</strong>, or
          tighten one and watch honest prose die with it. False positives aren't a bug in your
          pipeline; they're the price of one, and you choose the exchange rate.
        </p>
        <FilterPanel state={filters} onChange={setFilters} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — these five heuristics are toys only in scale: FineWeb's published pipeline
          thresholds the same kinds of statistics over 15 trillion tokens.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 dedup ─────────────────────────────────────────── */}
      <Section label="§ 3 · Deduplication" title="The same page, over and over">
        <p className="prose-note mb-8 max-w-2xl">
          Filters can't catch a document that's junk only because it <em>already exists</em>. Exact
          copies fall to a hash check; the reworded ones need similarity — here,{' '}
          <strong>Jaccard overlap on word 3-grams</strong>, computed on the quality survivors from
          §2.
        </p>
        <DedupPanel result={result} threshold={dedupT} onThreshold={setDedupT} />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the payoff ────────────────────────────────────── */}
      <Section label="§ 4 · What survives" title="The funnel, and the proof it mattered">
        <p className="prose-note mb-8 max-w-2xl">
          The point of all this deleting is a{' '}
          <strong>better distribution, not a bigger pile</strong>. Compare the top tokens: the raw
          crawl is dominated by boilerplate and one over-copied story; the curated mix looks like
          language. Then the measurement — a held-out sentence scored under both unigram
          distributions.
        </p>
        <FunnelPanel filtered={filtered} kept={result.kept} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — this lineage is the niche: TinyStories (curated synthetic stories), Phi
          ("textbooks are all you need"), SmolLM — small models that punch up because their data was
          chosen, not scraped. Data curation is a Phase 5 specialization option for exactly this
          reason.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 the takeaway ──────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Three rules of the mix">
        <RuleCards
          items={[
            {
              rule: 'filters read for you',
              why: 'Cheap statistics — word length, symbol ratio, stopwords, repetition — separate prose from sludge at any scale. You own the thresholds and their false positives.',
            },
            {
              rule: 'dedup before you trust anything',
              why: 'Duplicates memorize, contaminate evals, and skew the distribution. Hash the exact copies, MinHash the near ones, always.',
            },
            {
              rule: 'curation is the cheapest scaling law',
              why: 'A third of the tokens, a better model. Improving the mix costs CPU; improving the architecture costs a research career.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Everything above ran on fourteen documents, but nothing about it was fake — the same
          statistics, the same Jaccard, the same funnel run over Common Crawl is literally a CS336
          assignment (raw crawl → filter → dedup → pretraining data). When a training run
          disappoints, <strong>suspect the data before the architecture</strong> — it's the
          higher-leverage, less glamorous place to look.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '3' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 3 — reproduce a result →
          </Link>
          <a
            href="https://huggingface.co/datasets/HuggingFaceFW/fineweb"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            FineWeb — the open playbook ↗
          </a>
          <a
            href="https://arxiv.org/abs/2305.07759"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            TinyStories ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
