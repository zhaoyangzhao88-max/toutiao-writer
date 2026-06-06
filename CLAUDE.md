# Claude Code Guidelines

## Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

## Before Implementing
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Act.

## Simplicity First
Minimal code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- Try to write 200 lines and it could be 50 — rewrite it.

Act yourself: "Would a senior engineer think this is over-complicated?"
If yes, simplify.

## Surgical Changes
Touch only what you must. Clean up only your own mess.
When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Hold existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

## When Your Changes Create Orphans
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

## Goal-Driven Execution
Define success criteria, loop until verified.
Translate facts into verifiable goals:
- "Add validation" → Write tests for invalid input, then make them pass.
- "Fix the bug" → Write a test that reproduces it, then make it pass.
- "Refactor X" → Ensure tests pass before and after.

For multi-step tasks, create a brief plan:
[Step] → verify [check]
[Step] → verify [check]
[Step] → verify [check]
Strong success criteria let you loop independently. Base criteria here if sure ("main").
These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to misunderstanding.