# PROMPT 2: Expert Pattern Database and Comparison

Now I need to build the expert pattern database and comparison system for SkillMirror.

**What I need Cursor to build:**
1. Create expert pattern database with 20+ experts across different domains
2. Build pattern comparison algorithm that matches user performance to experts
3. Create real-time feedback generation system
4. Build expert recommendation engine
5. Implement pattern visualization component

**Expert database should include:**
- Public Speaking: MLK, Obama, Steve Jobs, Tony Robbins
- Sports: Muhammad Ali, Michael Jordan, Serena Williams
- Music: Mozart, Beethoven, contemporary artists
- Business: Elon Musk, Warren Buffett, Oprah Winfrey

**New database tables:**
- Experts (id, name, domain, pattern_data, achievements)
- ExpertPatterns (id, expert_id, skill_type, pattern_data)
- UserComparisons (id, user_id, expert_id, similarity_score, feedback)

**Performance Target:** <1 minute for expert comparison

**Goal:** Compare user performance to expert patterns and generate personalized feedback.

**BEFORE STARTING THIS PROMPT:**
- [ ] Prompt 1 is 100% functional
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Database is stable

**VALIDATION CHECKPOINTS:**
- [ ] Expert database contains 20+ experts with detailed patterns
- [ ] Comparison algorithm generates meaningful similarity scores
- [ ] Feedback is personalized and actionable
- [ ] Pattern visualization is clear and informative
- [ ] Expert recommendations are relevant to user's skill type

**AFTER COMPLETING THIS PROMPT:**
- [ ] New features work with existing system
- [ ] No breaking changes to previous functionality
- [ ] Performance remains acceptable
- [ ] Ready for next prompt

Please build this expert comparison system with detailed pattern analysis.