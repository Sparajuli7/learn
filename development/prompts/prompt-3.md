# PROMPT 3: Cross-Domain Skill Transfer Engine

I need to build the cross-domain skill transfer engine that teaches users how to apply skills from one domain to another.

**What I need Cursor to build:**
1. Create skill mapping algorithm for cross-domain transfers
2. Build "Boxing to Public Speaking" transfer module
3. Create "Coding to Cooking" transfer module
4. Build "Music to Business" transfer module
5. Implement transfer effectiveness tracking

**Cross-domain mappings:**
- Boxing → Public Speaking: Footwork → Stage presence, Timing → Speech rhythm
- Coding → Cooking: Logic → Recipe structure, Debugging → Taste testing
- Music → Business: Rhythm → Market timing, Harmony → Team collaboration

**New database tables:**
- SkillTransfers (id, source_skill, target_skill, mapping_data, effectiveness)
- TransferProgress (user_id, transfer_id, progress_percentage, completed_steps)
- TransferFeedback (id, user_id, transfer_id, feedback, improvement_score)

**Performance Target:** <30 seconds for transfer suggestions

**Goal:** Enable users to apply skills from one domain to another with real-time feedback.

**BEFORE STARTING THIS PROMPT:**
- [ ] Prompt 2 is 100% functional
- [ ] Expert comparison system works
- [ ] Database migrations are clean
- [ ] Performance benchmarks met

**VALIDATION CHECKPOINTS:**
- [ ] Skill mapping algorithm identifies relevant cross-domain connections
- [ ] Transfer modules provide actionable advice
- [ ] Transfer effectiveness tracking works
- [ ] Users can see clear progress in skill transfer
- [ ] Cross-domain suggestions are relevant and helpful

**AFTER COMPLETING THIS PROMPT:**
- [ ] Cross-domain features integrate with expert comparison
- [ ] No breaking changes to previous functionality
- [ ] Performance remains acceptable
- [ ] Ready for next prompt

Please build this cross-domain transfer system with detailed learning paths.