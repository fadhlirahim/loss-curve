import { createFileRoute } from '@tanstack/react-router'
import { BulletList } from '@/components/bullet-list'
import { Section } from '@/components/section'

export const Route = createFileRoute('/method')({
  head: () => ({ meta: [{ title: 'Research method · Roadmap to Mastery' }] }),
  component: MethodPage,
})

const SECTIONS = [
  {
    label: '§ 2 · Reading papers',
    title: 'Do this from week 1',
    body: (
      <>
        <p className="prose-note max-w-2xl">
          You don't "read" a paper start to finish. Use a multi-pass approach:
        </p>
        <ol className="mt-6 space-y-4">
          {[
            [
              'Pass 1 — skim (5 min)',
              "Title, abstract, figures, and the results table. Figures carry most of the signal. Ask: what problem, what's the claimed result, does it look real?",
            ],
            [
              'Pass 2 — method (15–30 min)',
              "Read the method section and the experimental setup. What exactly did they do? What's the baseline? What's the key comparison?",
            ],
            [
              'Pass 3 — deep (only for papers that matter)',
              'Work through the details, the math, the ablations. Try to find the weakness — what would you need to check to believe this?',
            ],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="font-mono text-sm text-vermillion">{i + 1}</span>
              <p className="prose-note">
                <strong>{t}.</strong> {d}
              </p>
            </li>
          ))}
        </ol>
        <p className="prose-note mt-6 max-w-2xl">
          <strong>Always write a note</strong> — even 3 sentences: what they claim, how they
          measured it, what the one weakness is. A paper you didn't take a note on, you didn't read.
          And read with the right question: not "is this true?" but{' '}
          <strong>"how was this measured, and how could it be wrong?"</strong> That question,
          applied relentlessly, is most of research taste. Aim for 2–3 papers/week, every week,
          forever.
        </p>
      </>
    ),
  },
  {
    label: '§ 3 · Reproduction',
    title: 'The core skill',
    body: (
      <BulletList
        items={[
          "Reproduce before you extend. You can't trust your extension if you can't reproduce the baseline.",
          'Containerize your environment (Docker/uv lockfiles) — "works on my machine" is the enemy of reproducibility, including your own future machine.',
          "When your reproduction doesn't match the paper, that gap is the most educational thing in the whole process. Chase it down; don't paper over it.",
          "A reproduction that's fully scripted, seeded, and documented is the template for every artifact you'll ship. In 2026 a clean reproduction is itself a publishable, valued contribution.",
        ]}
      />
    ),
  },
  {
    label: '§ 4 · Experiment design',
    title: 'How not to produce garbage',
    body: (
      <>
        <p className="prose-note max-w-2xl">
          The technical heart of the craft. A result is only worth as much as its design.
        </p>
        <BulletList
          className="mt-6"
          items={[
            [
              'One independent variable',
              "Vary the method or the data or the eval — never several at once, or you can't attribute the effect.",
            ],
            [
              'The right baseline',
              'Almost always a same-size / same-budget baseline, not a giant model. "My method beats a model 100× bigger" usually means you picked the wrong baseline.',
            ],
            [
              'Seeds',
              "≥3 seeds for any comparison you'll report. A single-run delta is often just noise; report variance, not a point.",
            ],
            [
              'Ablations',
              'To claim component X matters, show the result with and without X, everything else fixed.',
            ],
            [
              'Controls for confounds',
              'Match params and FLOPs; control for implementation quality; keep calibration and eval sets disjoint.',
            ],
            [
              'Pre-register the question',
              'Decide what would confirm or refute your hypothesis before you run it — the antidote to moving the goalposts to wherever the data landed.',
            ],
          ]}
        />
      </>
    ),
  },
  {
    label: '§ 5 · Evaluation',
    title: 'Deserves its own paranoia',
    body: (
      <p className="prose-note max-w-2xl">
        <strong>Assume your metric is lying until proven otherwise.</strong> Check for
        contamination, prompt sensitivity, and the gap between the metric and the behavior you
        actually care about. Prefer comparative/pairwise judgment over absolute scores for
        taste-based work. Never let a system grade its own output.
      </p>
    ),
  },
  {
    label: '§ 6 · The research log',
    title: 'Your external memory',
    body: (
      <>
        <p className="prose-note max-w-2xl">
          A dated log (<code className="font-mono text-[0.9em]">LOG.md</code> or daily notes) is the
          highest-ROI habit in this whole roadmap. Each entry:{' '}
          <strong>what I tried, what happened, what I learned, what's next.</strong>
        </p>
        <BulletList
          className="mt-6 space-y-3"
          items={[
            "It's how you avoid re-running failed experiments and re-deriving conclusions you already reached.",
            "It's the raw material of every writeup — a paper/blogpost is mostly a cleaned-up log.",
            'It externalizes your thinking so you can see your own reasoning errors.',
            'After compaction-of-memory (yours, biological), the log is what survives.',
          ]}
        />
        <p className="mt-6 font-mono text-ink-faint text-xs">start it in phase 0. never skip it.</p>
      </>
    ),
  },
  {
    label: '§ 7 · Writing',
    title: 'The multiplier',
    body: (
      <>
        <p className="prose-note max-w-2xl">
          Unwritten research barely exists. Writing is not a final step — it's a{' '}
          <strong>thinking tool</strong> that exposes the holes in your understanding. If you can't
          write it clearly, you don't understand it.
        </p>
        <BulletList
          className="mt-6"
          items={[
            [
              'The artifact writeup is the deliverable',
              'Not the code alone: what question, what you did (reproducibly), what you found, what the limitations are. Stating limitations honestly builds far more credibility than overclaiming.',
            ],
            [
              'Teach to learn, then animate it',
              'After you implement a concept, build a 20–40s animated explainer of it ("what backprop computes," "why FlashAttention saves memory"). Moving the pieces on screen forces the understanding, and the clip doubles as your proof-of-understanding artifact, a learn-in-public post, and storytelling reps. Tools: SVG/CSS for simple concepts, Manim for real math visualization. One rule: animate after you\'ve built it, never instead of building it.',
            ],
            [
              'Clarity over polish',
              'Reproducible numbers and honest framing beat elegant prose. The bar is open weights + a reproducible eval + honest baselines, not rhetoric.',
            ],
          ]}
        />
      </>
    ),
  },
  {
    label: '§ 8 · Feedback & taste',
    title: 'Built by volume, sharpened by harshness',
    body: (
      <BulletList
        items={[
          [
            'Seek harsh feedback early',
            "Show half-finished work to people who'll tell you it's wrong. Praise is useless; the person who finds your confound is doing you a favor.",
          ],
          [
            'Adversarial self-review',
            "Before believing your own result, try to refute it. What's the most likely reason it's wrong?",
          ],
          [
            'Taste is pattern-matching, built by volume',
            "Hundreds of papers read, dozens reproduced, a few bad experiments that burned you. You can't shortcut it; you can only accelerate the loop — faster, and in public.",
          ],
        ]}
      />
    ),
  },
]

function MethodPage() {
  return (
    <main>
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">The craft · runs through every phase</p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Research method
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Learning ML and <em>being a researcher</em> are different skills. You can know
          transformers cold and still not produce a trustworthy result. This is the second skill:
          how to read, reproduce, experiment, write, and not fool yourself.{' '}
          <strong>Start it in week 1</strong> — these habits compound over years.
        </p>
        <blockquote className="rise rise-3 mt-8 max-w-2xl border-vermillion border-l-2 pl-5 font-display text-ink-soft text-lg italic leading-relaxed">
          The cardinal sin of empirical ML is self-deception — believing a result that isn't real
          because you wanted it to be, or measured it carelessly. Almost everything below is a
          defense against that one failure.
        </blockquote>
      </div>

      <Section label="§ 1 · The research loop" title="A loop you'll run thousands of times">
        <pre className="overflow-x-auto border border-paper-edge bg-paper-deep/40 p-5 font-mono text-[0.78rem] text-ink-soft leading-relaxed">
          {`question → hypothesis → minimal experiment → result
        → interpret (skeptically) → write it down → next question`}
        </pre>
        <p className="prose-note mt-6 max-w-2xl">
          Keep each turn <strong>small</strong>. The beginner mistake is a giant experiment that
          answers nothing cleanly. One question, one variable, one clean comparison. Speed of
          iteration on this loop — not raw intelligence — is what separates productive researchers
          from stuck ones.
        </p>
      </Section>

      {SECTIONS.map((s) => (
        <div key={s.label}>
          <hr className="rule mx-auto max-w-4xl" />
          <Section label={s.label} title={s.title}>
            {s.body}
          </Section>
        </div>
      ))}

      <hr className="rule mx-auto max-w-4xl" />
      <Section label="§ 9 · The honest meta-point" title="Confidence is not evidence">
        <p className="prose-note max-w-2xl">
          A confident claim was once made in this very project — an API was "hallucinated" — that
          was simply false, caught only because someone pushed back and actually checked. That is
          the entire discipline in one anecdote:{' '}
          <strong>verify, and prefer being corrected to being wrong.</strong> Build that reflex into
          how you work, and most of research method takes care of itself.
        </p>
      </Section>
    </main>
  )
}
