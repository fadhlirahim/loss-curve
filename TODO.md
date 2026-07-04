# TODO

## Adversarial fact-check of the labs (KIV)

The labs' in-browser math is assertion-verified and all 30 external links/video IDs are
confirmed live and correct (2026-07-04). What has NOT happened: an independent review of
stated facts against primary sources — the builders checked their own work.

Plan: fresh reviewer agents (not the builders), one per lab, web access, instructed to
*refute* factual claims and audit that every pedagogical simplification is labeled.

Claims at risk, in order of blast radius:

- [ ] Hardware constants — H100 989 TFLOP/s bf16 / 3.35 TB/s HBM, 4090/A100 peaks, $/hr defaults (`gpu-systems`, `scaling-laws`)
- [ ] 16 bytes/param AdamW mixed-precision accounting + activation-memory formula (`gpu-systems`)
- [ ] Epoch AI re-fitted Chinchilla constants (E=1.8172, A=482.01, B=2085.43, α=0.3478, β=0.3658) — correction direction was right, values unreviewed (`scaling-laws`)
- [ ] Empirical claims — Muon ~1.35× data efficiency, "GPT-2 has previous-token heads", TinyStories→Phi→SmolLM framing, nanochat cost tiers (`optimization`, `attention`, `data-curation`, `pipeline`)
- [ ] Audit that every simplification is labeled (scalar residual caricature, illustrative pipeline outputs, toy tokenizer, bigram-scale schedule caveats)

## Later

- [ ] Phase 4 labs — post-training & eval (SFT/LoRA, DPO/GRPO, reward hacking, "how evals lie"). The eval lab is the priority; eval-as-discipline is the roadmap's stated differentiator.
- [ ] Phase 5 / RL-track labs — Q-learning gridworld is the natural first (RL-1's exact artifact).
- [ ] Labs v2: trained-checkpoint mode — train a tiny 2-layer char-transformer offline once, export weights as JSON, add a "learned mode" toggle to attention/positions/heads (the head-browser is the doorway to mech-interp).
- [ ] Attention lab v2 — temperature slider on softmax stage, value vectors + residual stream in §4, free-text sentences (needs trained checkpoint).
