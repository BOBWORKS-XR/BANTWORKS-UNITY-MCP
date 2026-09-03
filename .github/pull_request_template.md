## Linked Feedback

Link the feedback or bug issue this change addresses, for example `Closes #123`.

## Evidence Classification

- [ ] Confirmed broken
- [ ] Likely wrong but not yet proven
- [ ] Missing capability or documented enhancement

State the source, log, test, or observed behavior supporting that classification:

## Change

Describe the smallest user-visible change and why it belongs in the generic MCP rather than one Unity project.

## Verification

- [ ] Focused automated test added or updated where applicable
- [ ] `npm test` passes
- [ ] Unity bridge compiles in a representative project when changed
- [ ] Documentation/protocol updated when the public contract changed
- [ ] Security and compatibility impact considered

List exact versions, commands, and results:

## Acceptance Boundary

State what is source/build-verified and what still requires Unity, headset,
hosted-world, multiplayer, or other physical-device testing.

Keep the pull request in **Draft** until its focused verification is complete.
