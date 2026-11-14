# Review and improvements after 9107696

The prior commit implemented useful safety controls, but did not complete the plan's gameplay validation. Review found a winning result overwritten by the losing result, world-Y-only velocity normalization for side players, and audio queue resets that did not cancel scheduled voices.

This branch fixes those defects and adds a shared compact active-power timer strip, explicit pickup labels, and reduced trails for busy Solo scenes and reduced motion. Ranking formulas, procedural geometry, descent timing, and power budgets are preserved.

Ruling: prioritize reproducible defects and readable power feedback before altering difficulty. The current 100-seed test checks determinism, not human accessibility or fun; difficulty changes require play evidence.

Validation: 191 Node tests pass. Build dry run passes. Live production desktop court inspected in cloud browser. Branch browser QA remains blocked because Wrangler dev exits with uv_interface_addresses Unknown system error 1. No physical-phone or five-player study was performed. Do not treat this as completion of the full design plan.
