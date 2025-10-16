# TODO

## ✅ Google Calendar integration with app - RESEARCH COMPLETE
**Status**: Comprehensive implementation plan created
**Document**: See `claudedocs/google-calendar-integration-plan.md` for complete phased implementation guide

### Solution Summary:
- **Authentication**: Service Account with domain-wide delegation
- **Event Categorization**: Extended Properties + Color-coding (Red = Camps, Blue = Lessons)
- **Calendar Library**: react-big-calendar (lightweight, React-native)
- **Sync Strategy**: Polling (5-min) → Webhooks (future enhancement)
- **Page Name**: "Training Schedule" (recommended)
- **Timeline**: 6-8 weeks for full implementation (6 phases)

### Implementation Phases:
1. Phase 1: Google Calendar API Setup & Authentication (1-2 weeks)
2. Phase 2: Event Fetching & Categorization (1-2 weeks)
3. Phase 3: UI Components - List & Calendar Views (2-3 weeks)
4. Phase 4: Real-Time Sync with Polling (1 week)
5. Phase 5: Testing & Deployment (1 week)
6. Phase 6: Webhook Push Notifications (Optional - 2-3 weeks)

**Next Action**: Review implementation plan, get stakeholder approval, begin Phase 1