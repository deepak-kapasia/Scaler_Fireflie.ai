"""
Seed script — populates the database with realistic meeting data.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.database.connection import engine, SessionLocal, Base
import app.models.models  # Register all models

Base.metadata.create_all(bind=engine)

from app.models.models import (
    Meeting, Participant, MeetingParticipant,
    TranscriptSegment, Summary, KeyTopic, ActionItem, Chapter
)

db = SessionLocal()

# ──────────────────────────────────────────────
# Clear existing data
# ──────────────────────────────────────────────
print("Clearing existing data...")
db.query(KeyTopic).delete()
db.query(Summary).delete()
db.query(ActionItem).delete()
db.query(Chapter).delete()
db.query(TranscriptSegment).delete()
db.query(MeetingParticipant).delete()
db.query(Meeting).delete()
db.query(Participant).delete()
db.commit()

# ──────────────────────────────────────────────
# Participants
# ──────────────────────────────────────────────
print("Creating participants...")
participants = {
    "rahul": Participant(name="Rahul Sharma", email="rahul@company.com", avatar_color="#6366f1"),
    "priya": Participant(name="Priya Nair", email="priya@company.com", avatar_color="#ec4899"),
    "amit": Participant(name="Amit Verma", email="amit@company.com", avatar_color="#f59e0b"),
    "sarah": Participant(name="Sarah Chen", email="sarah@company.com", avatar_color="#10b981"),
    "james": Participant(name="James Wilson", email="james@company.com", avatar_color="#3b82f6"),
    "lisa": Participant(name="Lisa Park", email="lisa@company.com", avatar_color="#8b5cf6"),
    "david": Participant(name="David Kim", email="david@company.com", avatar_color="#ef4444"),
    "nina": Participant(name="Nina Patel", email="nina@company.com", avatar_color="#06b6d4"),
    "tom": Participant(name="Tom Bradley", email="tom@company.com", avatar_color="#84cc16"),
    "maya": Participant(name="Maya Gupta", email="maya@company.com", avatar_color="#f97316"),
}

for p in participants.values():
    db.add(p)
db.flush()

now = datetime.utcnow()


def add_meeting_participants(meeting, *roles):
    """roles: list of (participant_key, role_str)"""
    for key, role in roles:
        mp = MeetingParticipant(
            meeting_id=meeting.id,
            participant_id=participants[key].id,
            role=role,
        )
        db.add(mp)


# ──────────────────────────────────────────────
# Meeting 1: Product Planning
# ──────────────────────────────────────────────
print("Seeding Meeting 1: Product Planning...")
m1 = Meeting(
    title="Q3 Product Roadmap Planning",
    date=now - timedelta(days=1),
    duration_seconds=2820,  # 47 min
    recording_url=None,
    created_at=now - timedelta(days=1),
    updated_at=now - timedelta(days=1),
)
db.add(m1)
db.flush()
add_meeting_participants(m1, ("rahul", "host"), ("priya", "attendee"), ("sarah", "attendee"), ("james", "attendee"))

# Transcript
t1_segments = [
    (0, 12, "Rahul Sharma", "Alright everyone, let's get started. Today we need to finalize the Q3 product roadmap. I want us to walk through each major initiative and set clear priorities."),
    (13, 28, "Priya Nair", "Thanks Rahul. I've prepared a breakdown of the feature requests from the last customer survey. The top three themes are — better search, mobile app improvements, and API integrations."),
    (29, 45, "Sarah Chen", "That aligns with what the sales team is hearing. API integrations alone could unblock at least four enterprise deals. I'd recommend we prioritize that above mobile for this quarter."),
    (46, 65, "James Wilson", "From an engineering standpoint, API integrations are feasible in Q3 if we start the auth layer now. Mobile improvements would take longer because we'd need to refactor the state management."),
    (66, 80, "Rahul Sharma", "Good point. Let's lock in API integrations as priority one. Priya, can you work with James to scope out the exact requirements by end of this week?"),
    (81, 95, "Priya Nair", "Absolutely. I'll schedule a working session with the engineering team. We should also think about the new onboarding flow — the data shows a 40% drop-off in week one."),
    (96, 115, "Sarah Chen", "That's a big number. I've been talking to churned customers and the main complaint is the setup complexity. If we simplify onboarding, I think we can improve retention significantly."),
    (116, 135, "James Wilson", "We can build a guided setup wizard. It's roughly two sprints of work. We'd need design help from the product team."),
    (136, 155, "Rahul Sharma", "Great. Let's make onboarding our second priority. I want a prototype ready for review in three weeks. Sarah, can you write up the user journeys we need to optimize?"),
    (156, 170, "Sarah Chen", "Yes, I'll have that ready by Friday. Should I focus only on the first seven days or the full thirty-day lifecycle?"),
    (171, 185, "Rahul Sharma", "Focus on the first seven days for now. That's where we lose the most users. We can tackle the thirty-day journey in Q4."),
    (186, 205, "Priya Nair", "One more thing — we need to discuss the search overhaul. The current search is keyword-only and customers want semantic search. That would require a significant backend investment."),
    (206, 225, "James Wilson", "Semantic search is a substantial project. We'd need to integrate a vector database, update the indexing pipeline, and rebuild the search UI. Realistically, that's a Q4 project."),
    (226, 245, "Rahul Sharma", "Agreed. Let's put semantic search on the Q4 roadmap and ship a quick win in Q3 — maybe better filters and sorting in the existing search. Can you estimate that James?"),
    (246, 260, "James Wilson", "Better filters and sorting would be about one sprint. I can have an estimate in writing by Monday."),
    (261, 280, "Rahul Sharma", "Perfect. So our Q3 priorities are: one, API integrations; two, onboarding improvements; three, search filters. Everyone clear on their next steps?"),
    (281, 295, "Priya Nair", "Clear. I'll send a summary email after this call."),
    (296, 310, "Sarah Chen", "Got it. User journeys doc by Friday."),
    (311, 325, "James Wilson", "Estimates by Monday. Will also start the API auth spike this week."),
    (326, 345, "Rahul Sharma", "Excellent. Thank you all. Let's reconvene next Tuesday to check progress. Have a great rest of the day."),
]

for i, (start, end, speaker, text) in enumerate(t1_segments):
    db.add(TranscriptSegment(
        meeting_id=m1.id,
        speaker_name=speaker,
        start_time=float(start * 8),
        end_time=float(end * 8),
        text=text,
        sequence_order=i,
    ))

# Summary
s1 = Summary(meeting_id=m1.id, overview="The team finalized the Q3 product roadmap with three key priorities: API integrations to unblock enterprise sales, an onboarding improvement initiative targeting the 40% week-one drop-off, and quick-win search filter enhancements. Semantic search was deferred to Q4. Clear action items were assigned to Priya, Sarah, James, and Rahul.")
db.add(s1)
db.flush()
for i, topic in enumerate(["API Integrations", "Onboarding Improvements", "Search Enhancements", "Q4 Roadmap Preview", "Customer Retention Strategy"]):
    db.add(KeyTopic(summary_id=s1.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m1.id, assignee_name="Priya Nair", text="Schedule working session with engineering to scope API integration requirements", is_completed=True),
    ActionItem(meeting_id=m1.id, assignee_name="Sarah Chen", text="Write up user journeys for first-7-day onboarding optimization by Friday", is_completed=False),
    ActionItem(meeting_id=m1.id, assignee_name="James Wilson", text="Provide written estimate for search filters and sorting by Monday", is_completed=False),
    ActionItem(meeting_id=m1.id, assignee_name="James Wilson", text="Start API auth layer spike this week", is_completed=True),
    ActionItem(meeting_id=m1.id, assignee_name="Priya Nair", text="Send post-meeting summary email to the team", is_completed=True),
])

db.add_all([
    Chapter(meeting_id=m1.id, title="Welcome & Agenda", start_time=0, order_index=0),
    Chapter(meeting_id=m1.id, title="Customer Survey Themes", start_time=104, order_index=1),
    Chapter(meeting_id=m1.id, title="API Integrations Deep Dive", start_time=232, order_index=2),
    Chapter(meeting_id=m1.id, title="Onboarding Overhaul", start_time=648, order_index=3),
    Chapter(meeting_id=m1.id, title="Search Roadmap", start_time=1488, order_index=4),
    Chapter(meeting_id=m1.id, title="Q3 Priority Lock & Next Steps", start_time=2088, order_index=5),
])

# ──────────────────────────────────────────────
# Meeting 2: Engineering Standup
# ──────────────────────────────────────────────
print("Seeding Meeting 2: Engineering Standup...")
m2 = Meeting(
    title="Daily Engineering Standup",
    date=now - timedelta(hours=4),
    duration_seconds=900,  # 15 min
    recording_url=None,
    created_at=now - timedelta(hours=4),
    updated_at=now - timedelta(hours=4),
)
db.add(m2)
db.flush()
add_meeting_participants(m2, ("james", "host"), ("amit", "attendee"), ("nina", "attendee"), ("david", "attendee"))

t2_segments = [
    (0, 30, "James Wilson", "Good morning everyone. Quick standup — what did you work on yesterday, what's on today's plan, and any blockers? Amit, you want to go first?"),
    (31, 80, "Amit Verma", "Sure. Yesterday I finished the database migration for the new users table and wrote unit tests. Today I'm going to start on the API endpoint for bulk data exports. No blockers right now."),
    (81, 130, "Nina Patel", "Yesterday I worked on the frontend for the dashboard redesign. Got the new card components done and reviewed. Today I'll be integrating the charts. One blocker — I need the new color tokens from design. David, can you share those?"),
    (131, 160, "David Kim", "Yes, I'll send those over after standup. Yesterday I finished the accessibility audit for the settings page. Today I'm starting on the mobile navigation refactor. No blockers."),
    (161, 220, "James Wilson", "Great progress all around. Just a heads up — we have a code freeze at 5 PM today for the release. Make sure all PRs that need to go in are reviewed and merged by 4. Amit, your migration PR should go in first since Nina's charts depend on the new data format."),
    (221, 265, "Amit Verma", "Understood. I'll ping you for a review by noon."),
    (266, 310, "Nina Patel", "And once I get those design tokens David, I can finish the charts this afternoon."),
    (311, 355, "David Kim", "Sending them now. Also James, I wanted to flag — I found three accessibility issues in the main nav that aren't covered by the current sprint. Should I create tickets?"),
    (356, 420, "James Wilson", "Yes, create tickets and tag them as accessibility-backlog. We'll triage them in next week's planning. Anything else? No? Great, let's get to it. Good luck today team."),
]

for i, (start, end, speaker, text) in enumerate(t2_segments):
    db.add(TranscriptSegment(
        meeting_id=m2.id,
        speaker_name=speaker,
        start_time=float(start),
        end_time=float(end),
        text=text,
        sequence_order=i,
    ))

s2 = Summary(meeting_id=m2.id, overview="Brief daily standup covering individual progress updates, blockers, and coordination. Amit is finishing the migration PR, Nina needs design tokens for chart integration, and David is addressing accessibility issues. Code freeze is at 5 PM today.")
db.add(s2)
db.flush()
for i, topic in enumerate(["Database Migration Progress", "Frontend Dashboard Redesign", "Mobile Navigation Refactor", "Code Freeze at 5 PM"]):
    db.add(KeyTopic(summary_id=s2.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m2.id, assignee_name="Amit Verma", text="Submit migration PR for review by noon", is_completed=True),
    ActionItem(meeting_id=m2.id, assignee_name="David Kim", text="Share design color tokens with Nina", is_completed=True),
    ActionItem(meeting_id=m2.id, assignee_name="David Kim", text="Create tickets for three accessibility issues in main nav", is_completed=False),
])

db.add_all([
    Chapter(meeting_id=m2.id, title="Opening & Agenda", start_time=0, order_index=0),
    Chapter(meeting_id=m2.id, title="Amit's Update", start_time=31, order_index=1),
    Chapter(meeting_id=m2.id, title="Nina's Update", start_time=81, order_index=2),
    Chapter(meeting_id=m2.id, title="David's Update", start_time=131, order_index=3),
    Chapter(meeting_id=m2.id, title="Code Freeze & Wrap-Up", start_time=161, order_index=4),
])

# ──────────────────────────────────────────────
# Meeting 3: Sprint Review
# ──────────────────────────────────────────────
print("Seeding Meeting 3: Sprint Review...")
m3 = Meeting(
    title="Sprint 22 Review & Demo",
    date=now - timedelta(days=3),
    duration_seconds=3600,
    recording_url=None,
    created_at=now - timedelta(days=3),
    updated_at=now - timedelta(days=3),
)
db.add(m3)
db.flush()
add_meeting_participants(m3, ("rahul", "host"), ("james", "attendee"), ("priya", "attendee"), ("amit", "attendee"), ("nina", "attendee"), ("sarah", "attendee"))

t3_segments = [
    (0, 15, "Rahul Sharma", "Welcome to the Sprint 22 review. This was a big sprint — fourteen story points completed out of sixteen planned. Let's walk through everything that shipped."),
    (16, 45, "James Wilson", "I'll kick off with the backend work. We shipped the new notifications service, updated the authentication flow to use JWT refresh tokens, and resolved six production bugs including the critical payment processing race condition."),
    (46, 80, "Amit Verma", "On the database side, I completed the migration to the new schema, added indexes on the search fields, and improved query performance — average response time dropped from 340ms to 87ms."),
    (81, 110, "Nina Patel", "Frontend shipped the redesigned dashboard — new cards, updated typography, and the new color system. Also finished the responsive layouts for tablet. Let me do a quick demo."),
    (111, 160, "Nina Patel", "So here you can see the new dashboard. The cards now show richer data and we have quick actions on hover. The filters are sticky as you scroll. On tablet, it collapses to a two-column layout automatically."),
    (161, 185, "Priya Nair", "This looks great Nina. The hover states feel much more polished. One question — can we make the create button more prominent? Some users might miss it."),
    (186, 205, "Nina Patel", "Absolutely. I can move it to the top right and make it a filled primary button rather than outlined. I'll update that in the next sprint."),
    (206, 235, "Sarah Chen", "From a product perspective this sprint delivered on our velocity commitment and the dashboard redesign directly addresses the feedback from our top twenty enterprise customers. Really solid work."),
    (236, 265, "Rahul Sharma", "Agreed. Two items that didn't make it in — the export to PDF feature and the webhook documentation. James, what happened with those?"),
    (266, 295, "James Wilson", "Export to PDF hit a dependency issue with the PDF library on our infrastructure. We have a fix but it needs additional testing. Webhook docs got deprioritized when we had to fix the payment bug."),
    (296, 320, "Rahul Sharma", "Understood. Both of those roll into Sprint 23. Let's make export to PDF the first item we commit to. Any questions before we close?"),
    (321, 345, "Priya Nair", "Just want to confirm — the dashboard changes will go to production tonight?"),
    (346, 360, "James Wilson", "Yes, after the code freeze review. Should be live by midnight."),
    (361, 380, "Rahul Sharma", "Perfect. Great sprint everyone. Let's keep this momentum into Sprint 23."),
]

for i, (start, end, speaker, text) in enumerate(t3_segments):
    db.add(TranscriptSegment(
        meeting_id=m3.id,
        speaker_name=speaker,
        start_time=float(start * 15),
        end_time=float(end * 15),
        text=text,
        sequence_order=i,
    ))

s3 = Summary(meeting_id=m3.id, overview="Sprint 22 delivered 14 out of 16 planned story points. Key achievements include a new notifications service, JWT refresh token auth, performance improvements bringing response times from 340ms to 87ms, and a full dashboard redesign. Two items — PDF export and webhook docs — roll over to Sprint 23.")
db.add(s3)
db.flush()
for i, topic in enumerate(["Backend Services Shipped", "Database Performance Improvements", "Dashboard Redesign Demo", "Unfinished Items Rollover", "Sprint 23 Preview"]):
    db.add(KeyTopic(summary_id=s3.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m3.id, assignee_name="Nina Patel", text="Make Create button more prominent — move to top right, fill primary style", is_completed=True),
    ActionItem(meeting_id=m3.id, assignee_name="James Wilson", text="Complete PDF export testing and deploy to Sprint 23", is_completed=False),
    ActionItem(meeting_id=m3.id, assignee_name="James Wilson", text="Write webhook documentation in Sprint 23", is_completed=False),
    ActionItem(meeting_id=m3.id, assignee_name="Rahul Sharma", text="Confirm dashboard deployment to production after code freeze review", is_completed=True),
])

db.add_all([
    Chapter(meeting_id=m3.id, title="Sprint Summary", start_time=0, order_index=0),
    Chapter(meeting_id=m3.id, title="Backend Achievements", start_time=240, order_index=1),
    Chapter(meeting_id=m3.id, title="Database Performance", start_time=690, order_index=2),
    Chapter(meeting_id=m3.id, title="Frontend Demo", start_time=1215, order_index=3),
    Chapter(meeting_id=m3.id, title="Incomplete Items", start_time=3540, order_index=4),
])

# ──────────────────────────────────────────────
# Meeting 4: Design Review
# ──────────────────────────────────────────────
print("Seeding Meeting 4: Design Review...")
m4 = Meeting(
    title="New Onboarding Flow Design Review",
    date=now - timedelta(days=5),
    duration_seconds=2400,
    recording_url=None,
    created_at=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)
db.add(m4)
db.flush()
add_meeting_participants(m4, ("priya", "host"), ("nina", "attendee"), ("sarah", "attendee"), ("maya", "attendee"))

t4_segments = [
    (0, 20, "Priya Nair", "Thanks everyone for joining. Today we're reviewing the new onboarding flow designs. Maya, you've been leading this — do you want to walk us through the concept?"),
    (21, 60, "Maya Gupta", "Happy to. So we started from the core problem: users feel overwhelmed in the first session. Our research showed they receive eleven emails in the first week and have to make too many decisions before they see value."),
    (61, 90, "Maya Gupta", "The new approach is a single-path wizard with progressive disclosure. Step one: connect your calendar. Step two: invite one teammate. Step three: record your first meeting. We then personalize the experience based on their first meeting."),
    (91, 115, "Nina Patel", "I love the single-path approach. From a frontend perspective — will the wizard need to be interruptible? Like if someone closes it halfway through, do we resume where they left off?"),
    (116, 135, "Maya Gupta", "Yes, absolutely. We track the completion status per user and resume on next login if they've started but not finished."),
    (136, 165, "Sarah Chen", "This is exactly what customers have been asking for. One suggestion — the 'invite a teammate' step currently has no social proof. I'd add a line like 'Teams who collaborate see 3x more meetings recorded.' It reduces hesitation."),
    (166, 180, "Maya Gupta", "Great idea Sarah. I'll add that context line. Let me note that down."),
    (181, 210, "Priya Nair", "I want to discuss the step three screen — the 'record your first meeting' prompt. What if the user doesn't have a meeting scheduled today? We shouldn't block them there."),
    (211, 235, "Maya Gupta", "Valid concern. I've designed a fallback state: if no meeting is detected, we show a sample meeting recording they can explore. That way they still see the product value without requiring a live meeting."),
    (236, 260, "Nina Patel", "That's clever. I'll need the sample meeting data from the team. Priya, can we use real (anonymized) meeting data or should we create synthetic content?"),
    (261, 280, "Priya Nair", "Let's create synthetic content — using real meetings creates privacy risk even if anonymized. I'll write some sample dialogue this week."),
    (281, 310, "Sarah Chen", "One more piece of feedback — the color palette feels a bit corporate. Can we warm it up slightly? Our target customers are startup teams and the current palette might feel too enterprise."),
    (311, 335, "Maya Gupta", "Noted. I'll experiment with warmer neutrals and show three palette options in next week's review. I think we can keep the brand colors but warm the backgrounds and text."),
    (336, 360, "Priya Nair", "This is looking really strong. I'm going to share these with the engineering team so James can start scoping. Thanks Maya and everyone for the great feedback."),
]

for i, (start, end, speaker, text) in enumerate(t4_segments):
    db.add(TranscriptSegment(
        meeting_id=m4.id,
        speaker_name=speaker,
        start_time=float(start * 6),
        end_time=float(end * 6),
        text=text,
        sequence_order=i,
    ))

s4 = Summary(meeting_id=m4.id, overview="The team reviewed the new three-step onboarding wizard design from Maya. Key improvements over the existing flow include progressive disclosure, single-path navigation, and a personalized experience after the first meeting. Feedback included adding social proof to the invite step, handling the case when no meeting is scheduled, and exploring a warmer color palette.")
db.add(s4)
db.flush()
for i, topic in enumerate(["Onboarding Wizard Concept", "Progressive Disclosure", "Sample Meeting Fallback State", "Social Proof in Invite Step", "Color Palette Feedback"]):
    db.add(KeyTopic(summary_id=s4.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m4.id, assignee_name="Maya Gupta", text="Add social proof text to invite teammate step", is_completed=True),
    ActionItem(meeting_id=m4.id, assignee_name="Priya Nair", text="Write synthetic sample meeting dialogue for fallback state", is_completed=False),
    ActionItem(meeting_id=m4.id, assignee_name="Maya Gupta", text="Create three alternative warm color palette options for next review", is_completed=False),
    ActionItem(meeting_id=m4.id, assignee_name="Priya Nair", text="Share designs with engineering team for scoping", is_completed=True),
])

db.add_all([
    Chapter(meeting_id=m4.id, title="Problem Statement", start_time=0, order_index=0),
    Chapter(meeting_id=m4.id, title="New Wizard Concept Walkthrough", start_time=126, order_index=1),
    Chapter(meeting_id=m4.id, title="Engineering Considerations", start_time=546, order_index=2),
    Chapter(meeting_id=m4.id, title="Design Feedback", start_time=816, order_index=3),
    Chapter(meeting_id=m4.id, title="Next Steps", start_time=2016, order_index=4),
])

# ──────────────────────────────────────────────
# Meeting 5: Client Meeting
# ──────────────────────────────────────────────
print("Seeding Meeting 5: Client Meeting...")
m5 = Meeting(
    title="Acme Corp Quarterly Business Review",
    date=now - timedelta(days=7),
    duration_seconds=3300,
    recording_url=None,
    created_at=now - timedelta(days=7),
    updated_at=now - timedelta(days=7),
)
db.add(m5)
db.flush()
add_meeting_participants(m5, ("sarah", "host"), ("rahul", "attendee"), ("tom", "attendee"))

t5_segments = [
    (0, 20, "Sarah Chen", "Thank you for joining us today, Tom. We're excited to share what we've been working on and get your team's feedback on how the platform has been performing for Acme."),
    (21, 55, "Tom Bradley", "Of course. We've been using the platform for three months now and overall the team is happy. Our biggest win has been the automatic transcription — it's saved our sales team probably six hours a week in note-taking."),
    (56, 80, "Sarah Chen", "That's fantastic to hear. Six hours a week across how many sales reps?"),
    (81, 95, "Tom Bradley", "We have twenty-two reps using it daily. So roughly 130 hours saved per week company-wide."),
    (96, 120, "Rahul Sharma", "That's a significant impact. And from a quality standpoint — are the transcripts accurate enough for your use case? I know accuracy is always a concern."),
    (121, 160, "Tom Bradley", "For our industry — software sales — accuracy is excellent. We deal with very standard terminology. The one challenge is jargon-specific to our product. We have about forty proprietary terms that still get transcribed incorrectly."),
    (161, 195, "Rahul Sharma", "We're actually launching custom vocabulary in next quarter's release. You'd be able to add your forty terms and they'd be prioritized in transcription. Would that solve the problem?"),
    (196, 215, "Tom Bradley", "Completely. That would be a ten out of ten feature for us. When is it coming?"),
    (216, 235, "Rahul Sharma", "We're targeting a public beta in October. I can put Acme on the early access list if that's useful."),
    (236, 250, "Tom Bradley", "Absolutely, please do that. What else is on the roadmap?"),
    (251, 290, "Sarah Chen", "We're also working on CRM integration — direct sync with Salesforce and HubSpot so meeting summaries and action items flow into your deal records automatically. That's also targeting Q4."),
    (291, 320, "Tom Bradley", "That would be huge for us. We currently have a manual process where reps copy action items into Salesforce. It takes ten minutes per meeting. With thirty meetings a day that's five hours of admin work we could eliminate."),
    (321, 345, "Sarah Chen", "Exactly the use case we're designing for. I'll add Tom's team to the CRM integration beta list as well."),
    (346, 380, "Tom Bradley", "One ask from our side — we'd love a way to export meeting data in bulk for our own reporting. We have a data team that wants to analyze meeting patterns across deals."),
    (381, 405, "Rahul Sharma", "We have an API export endpoint in progress. I'll connect you with our developer relations team to get early access. You'd be able to pull all your meeting data, transcripts, and summaries programmatically."),
    (406, 430, "Tom Bradley", "Perfect. From a contract standpoint — we're coming up on renewal in sixty days. Based on what I'm hearing about the roadmap, I think we'll be expanding, not just renewing. I want to add the enterprise tier."),
    (431, 460, "Sarah Chen", "Wonderful news Tom. I'll have our account team send over the enterprise tier details and a custom quote by end of week. Looking forward to continuing this partnership."),
]

for i, (start, end, speaker, text) in enumerate(t5_segments):
    db.add(TranscriptSegment(
        meeting_id=m5.id,
        speaker_name=speaker,
        start_time=float(start * 7),
        end_time=float(end * 7),
        text=text,
        sequence_order=i,
    ))

s5 = Summary(meeting_id=m5.id, overview="Quarterly business review with Acme Corp's Tom Bradley. The client reports significant time savings from transcription (130 hrs/week across 22 reps). Key concerns: custom vocabulary for proprietary terms (resolved in Q4 beta), CRM integration request, and bulk data export API. Client is planning to expand to enterprise tier on contract renewal in 60 days.")
db.add(s5)
db.flush()
for i, topic in enumerate(["ROI Achieved by Acme Corp", "Custom Vocabulary Feature Request", "CRM Integration Preview", "Bulk Data Export API", "Contract Renewal & Expansion"]):
    db.add(KeyTopic(summary_id=s5.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m5.id, assignee_name="Rahul Sharma", text="Add Acme Corp to custom vocabulary early access list for October beta", is_completed=True),
    ActionItem(meeting_id=m5.id, assignee_name="Sarah Chen", text="Add Tom's team to CRM integration beta list", is_completed=True),
    ActionItem(meeting_id=m5.id, assignee_name="Rahul Sharma", text="Connect Tom Bradley with developer relations team for API export early access", is_completed=False),
    ActionItem(meeting_id=m5.id, assignee_name="Sarah Chen", text="Send enterprise tier details and custom quote to Acme by end of week", is_completed=False),
])

db.add_all([
    Chapter(meeting_id=m5.id, title="Welcome & Intro", start_time=0, order_index=0),
    Chapter(meeting_id=m5.id, title="ROI & Usage Report", start_time=147, order_index=1),
    Chapter(meeting_id=m5.id, title="Transcription Accuracy", start_time=672, order_index=2),
    Chapter(meeting_id=m5.id, title="Product Roadmap Preview", start_time=1127, order_index=3),
    Chapter(meeting_id=m5.id, title="Client Requests", start_time=2422, order_index=4),
    Chapter(meeting_id=m5.id, title="Contract Renewal Discussion", start_time=2842, order_index=5),
])

# ──────────────────────────────────────────────
# Meeting 6: Architecture Review
# ──────────────────────────────────────────────
print("Seeding Meeting 6: Architecture Review...")
m6 = Meeting(
    title="Backend Architecture Review: Microservices Migration",
    date=now - timedelta(days=10),
    duration_seconds=4200,
    recording_url=None,
    created_at=now - timedelta(days=10),
    updated_at=now - timedelta(days=10),
)
db.add(m6)
db.flush()
add_meeting_participants(m6, ("james", "host"), ("amit", "attendee"), ("rahul", "attendee"), ("david", "attendee"))

t6_segments = [
    (0, 18, "James Wilson", "Let's dig into the microservices migration plan. We've been on a monolith for four years and it's starting to show strain at our current scale. I want us to align on the approach before we start breaking things apart."),
    (19, 50, "Amit Verma", "I've been analyzing the monolith. The natural seam is around the core domains: authentication, meetings, transcription, billing, and notifications. Each of those could become an independent service."),
    (51, 80, "Rahul Sharma", "From a product perspective, the most important ones to extract first are transcription and notifications. Transcription is computationally intensive and hurts all other users when it spikes. Notifications need to be reliable regardless of what happens elsewhere."),
    (81, 120, "James Wilson", "Agreed. My recommendation is a strangler fig pattern. We build new functionality as microservices and gradually extract existing features. We don't do a big bang rewrite."),
    (121, 155, "David Kim", "How do we handle the database? Right now everything shares a single Postgres instance. If we split by domain, we need to figure out data ownership and how we handle cross-domain queries."),
    (156, 200, "Amit Verma", "Each service gets its own database — that's the standard approach. For cross-domain queries, we use events and eventual consistency where we can, and API calls where we need synchronous data. It's more complex but necessary for true service independence."),
    (201, 235, "James Wilson", "Let's talk about the service communication layer. I've evaluated gRPC, REST over HTTP2, and message queues. My recommendation is a hybrid: synchronous gRPC for low-latency inter-service calls, and Kafka for async event streaming."),
    (236, 265, "David Kim", "Kafka is a significant operational complexity addition. Do we have the team to manage it? Have you considered using a managed service like AWS MSK or a simpler alternative like RabbitMQ?"),
    (266, 295, "James Wilson", "Fair point. For the initial phase, we can use AWS SQS — it's simpler to operate and covers our use cases. We can migrate to Kafka if we need more sophisticated streaming later."),
    (296, 325, "Amit Verma", "I also want to bring up observability. In a distributed system, debugging is much harder. We need to invest in distributed tracing from day one. OpenTelemetry with Jaeger, or we use a managed APM like Datadog."),
    (326, 360, "Rahul Sharma", "Let's use Datadog — we already have a contract and it covers both APM and logging. That removes one infrastructure decision."),
    (361, 395, "James Wilson", "Good call. So our stack for the migration: strangler fig pattern, service-per-domain, Postgres per service, gRPC for sync calls, SQS for async, Datadog for observability. Amit, can you write a detailed ADR for this?"),
    (396, 415, "Amit Verma", "Yes. I'll have an Architecture Decision Record drafted by end of the week for review."),
    (416, 445, "David Kim", "We should also think about API gateway and service discovery. Are we self-managing or using something like AWS API Gateway?"),
    (446, 480, "James Wilson", "I'd lean toward AWS API Gateway with Lambda authorizers for authentication. Minimal ops overhead and it integrates well with our existing AWS infrastructure."),
    (481, 510, "Rahul Sharma", "One business constraint I want to flag — we cannot have any user-visible downtime during the migration. Whatever we do needs to be gradual and reversible."),
    (511, 545, "James Wilson", "The strangler fig pattern handles that. We can route traffic between old and new implementations with feature flags. Rollback is always available. I'll document the rollback procedures in the ADR."),
    (546, 570, "Amit Verma", "Timeline estimate: I think we can have the first service — notifications — extracted in about eight weeks. That gives us a template for subsequent services."),
    (571, 600, "James Wilson", "Eight weeks sounds right. Let's plan for a Q4 timeline — extract notifications and transcription as the first two services. Authentication and billing follow in Q1 next year."),
]

for i, (start, end, speaker, text) in enumerate(t6_segments):
    db.add(TranscriptSegment(
        meeting_id=m6.id,
        speaker_name=speaker,
        start_time=float(start * 7),
        end_time=float(end * 7),
        text=text,
        sequence_order=i,
    ))

s6 = Summary(meeting_id=m6.id, overview="The team aligned on a microservices migration strategy using the strangler fig pattern — no big bang rewrite. Key decisions: 5 service domains (auth, meetings, transcription, billing, notifications), Postgres per service, gRPC for sync + SQS for async, Datadog for observability, AWS API Gateway for routing. Notifications service extracts first in Q4 (~8 weeks).")
db.add(s6)
db.flush()
for i, topic in enumerate(["Strangler Fig Migration Pattern", "Service Domain Boundaries", "Database Per Service Strategy", "gRPC + SQS Communication Layer", "Observability with Datadog", "Migration Timeline: Q4-Q1"]):
    db.add(KeyTopic(summary_id=s6.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m6.id, assignee_name="Amit Verma", text="Write Architecture Decision Record (ADR) for microservices migration plan by end of week", is_completed=False),
    ActionItem(meeting_id=m6.id, assignee_name="James Wilson", text="Document rollback procedures in the ADR", is_completed=False),
    ActionItem(meeting_id=m6.id, assignee_name="James Wilson", text="Set up Datadog APM for distributed tracing in dev environment", is_completed=False),
    ActionItem(meeting_id=m6.id, assignee_name="David Kim", text="Research AWS API Gateway Lambda authorizer setup for service auth", is_completed=False),
    ActionItem(meeting_id=m6.id, assignee_name="Amit Verma", text="Begin notifications service extraction — target 8-week completion", is_completed=False),
])

db.add_all([
    Chapter(meeting_id=m6.id, title="Monolith Pain Points", start_time=0, order_index=0),
    Chapter(meeting_id=m6.id, title="Domain Boundaries", start_time=133, order_index=1),
    Chapter(meeting_id=m6.id, title="Strangler Fig Strategy", start_time=567, order_index=2),
    Chapter(meeting_id=m6.id, title="Database Architecture", start_time=847, order_index=3),
    Chapter(meeting_id=m6.id, title="Service Communication", start_time=1407, order_index=4),
    Chapter(meeting_id=m6.id, title="Observability & Tooling", start_time=2072, order_index=5),
    Chapter(meeting_id=m6.id, title="Migration Timeline", start_time=3997, order_index=6),
])

# ──────────────────────────────────────────────
# Meeting 7: Hiring Discussion
# ──────────────────────────────────────────────
print("Seeding Meeting 7: Hiring Discussion...")
m7 = Meeting(
    title="Engineering Hiring — Senior Backend Role",
    date=now - timedelta(days=14),
    duration_seconds=2100,
    recording_url=None,
    created_at=now - timedelta(days=14),
    updated_at=now - timedelta(days=14),
)
db.add(m7)
db.flush()
add_meeting_participants(m7, ("rahul", "host"), ("james", "attendee"), ("lisa", "attendee"))

t7_segments = [
    (0, 20, "Rahul Sharma", "Thanks for jumping on this. We've been running understaffed on backend for two quarters. I want us to discuss the senior backend role — who we're looking for and what our interview process should be."),
    (21, 60, "James Wilson", "My biggest need is someone who can own complex systems. We're heading into a microservices migration and I need someone who's been through that journey before. Strong distributed systems background is non-negotiable for me."),
    (61, 95, "Lisa Park", "From a recruiting standpoint, the distributed systems requirement will narrow the pool significantly. Should we be open to senior engineers with strong growth potential who haven't done microservices but have the fundamentals?"),
    (96, 125, "James Wilson", "I'm open to that if they have strong fundamentals — concurrency, data modeling, system design. The microservices patterns can be learned. The fundamentals can't."),
    (126, 155, "Rahul Sharma", "Good. Let's keep the bar high on fundamentals but be flexible on specific experience. What does the interview loop look like?"),
    (156, 200, "James Wilson", "I'd suggest: recruiter screen, technical phone screen with me, a system design round, a coding round focused on real problems not LeetCode trivia, and a culture/values interview. Final decision requires consensus, not hierarchy."),
    (201, 225, "Lisa Park", "That's a good structure. I'd add — we should aim to complete the entire loop within two weeks. Candidates at this level have multiple offers and move fast. If we drag out the process, we'll lose the best people."),
    (226, 255, "Rahul Sharma", "Agreed. Two-week loop maximum. Lisa, can you set up our ATS with these stages and target posting the role on LinkedIn and Greenhouse by Thursday?"),
    (256, 275, "Lisa Park", "Yes, I'll have the job posting ready for your review by tomorrow. I'll also reach out to our referred candidates first — we have three warm referrals from the last hiring round that we didn't progress."),
    (276, 305, "James Wilson", "Let's definitely revisit those referrals — context makes a huge difference. Also, can we offer a technical challenge that's take-home and practical? The candidate solves a real problem similar to what we do here."),
    (306, 335, "Rahul Sharma", "Yes. Can you design that challenge James? Something that takes three to four hours maximum. We don't want to ask for too much unpaid work."),
    (336, 360, "James Wilson", "I'll design a distributed system debugging challenge. Something they'd actually encounter on the job. I'll have it ready by end of week."),
]

for i, (start, end, speaker, text) in enumerate(t7_segments):
    db.add(TranscriptSegment(
        meeting_id=m7.id,
        speaker_name=speaker,
        start_time=float(start * 5),
        end_time=float(end * 5),
        text=text,
        sequence_order=i,
    ))

s7 = Summary(meeting_id=m7.id, overview="Planning meeting for the senior backend engineer role. The role prioritizes distributed systems fundamentals over specific microservices experience. Interview loop: recruiter screen → technical phone screen → system design → practical coding challenge → culture interview. Target: 2-week loop, job posting by Thursday, three warm referrals to revisit first.")
db.add(s7)
db.flush()
for i, topic in enumerate(["Role Requirements & Must-Haves", "Interview Loop Design", "Two-Week Process SLA", "Take-Home Technical Challenge", "Referral Pipeline"]):
    db.add(KeyTopic(summary_id=s7.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m7.id, assignee_name="Lisa Park", text="Prepare job posting for Rahul's review by tomorrow", is_completed=True),
    ActionItem(meeting_id=m7.id, assignee_name="Lisa Park", text="Post role on LinkedIn and Greenhouse by Thursday", is_completed=True),
    ActionItem(meeting_id=m7.id, assignee_name="Lisa Park", text="Re-engage three warm referrals from last hiring round", is_completed=False),
    ActionItem(meeting_id=m7.id, assignee_name="James Wilson", text="Design take-home technical challenge (3-4 hours max) by end of week", is_completed=False),
    ActionItem(meeting_id=m7.id, assignee_name="Lisa Park", text="Set up ATS with interview loop stages and SLA tracking", is_completed=True),
])

db.add_all([
    Chapter(meeting_id=m7.id, title="Role Context & Gap", start_time=0, order_index=0),
    Chapter(meeting_id=m7.id, title="Candidate Profile", start_time=105, order_index=1),
    Chapter(meeting_id=m7.id, title="Interview Process Design", start_time=630, order_index=2),
    Chapter(meeting_id=m7.id, title="Timeline & Posting", start_time=1130, order_index=3),
    Chapter(meeting_id=m7.id, title="Technical Challenge Design", start_time=1530, order_index=4),
])

# ──────────────────────────────────────────────
# Meeting 8: Project Retrospective
# ──────────────────────────────────────────────
print("Seeding Meeting 8: Project Retrospective...")
m8 = Meeting(
    title="Project Phoenix Retrospective",
    date=now - timedelta(days=20),
    duration_seconds=3000,
    recording_url=None,
    created_at=now - timedelta(days=20),
    updated_at=now - timedelta(days=20),
)
db.add(m8)
db.flush()
add_meeting_participants(m8, ("priya", "host"), ("james", "attendee"), ("amit", "attendee"), ("nina", "attendee"), ("sarah", "attendee"), ("david", "attendee"))

t8_segments = [
    (0, 15, "Priya Nair", "Project Phoenix is wrapped. We shipped six weeks ago and the numbers are in. Before we move to the next project, I want us to reflect honestly — what went well, what didn't, and what we change next time."),
    (16, 50, "Sarah Chen", "I'll start with what went well. The daily cross-functional syncs were transformative. For the first time, product, engineering, and design were truly in sync. We caught misalignments early instead of at launch."),
    (51, 80, "James Wilson", "I agree. The shared Slack channel with real-time updates was also great. No one was ever surprised by a delay because everyone could see the status. Transparency was a real asset."),
    (81, 110, "Amit Verma", "Technically, the decision to start with a proof of concept before committing to the full implementation saved us probably three weeks. We identified two major technical risks early."),
    (111, 140, "Nina Patel", "Design-wise, having engineers attend design reviews from the start meant we didn't have designs that couldn't be built. That prevented so much back-and-forth later."),
    (141, 175, "David Kim", "What didn't go well: scope creep in weeks four and five. We added three features that weren't in the original spec. Each felt small but together they pushed the deadline by two weeks."),
    (176, 210, "James Wilson", "The scope creep was partly a process failure. We didn't have a clear change management process. Anything that affected the timeline should have required a formal decision with a documented trade-off."),
    (211, 240, "Priya Nair", "That's a fair critique and I take ownership of it as project lead. Going forward, any scope change must go through a formal process with impact assessment. Even seemingly small additions."),
    (241, 275, "Sarah Chen", "Another area for improvement: customer communication during the project. We had three enterprise customers who were expecting features from Phoenix and we didn't give them enough visibility into our timeline."),
    (276, 305, "Nina Patel", "I want to raise the tooling issue. We had three different project management tools being used simultaneously by different team members. That created confusion about where the source of truth was."),
    (306, 335, "Priya Nair", "We're standardizing on Linear going forward. One tool, one source of truth. I'll set it up for the next project and make sure everyone is trained before kickoff."),
    (336, 365, "Amit Verma", "Overall though, Phoenix shipped, customers love it, and engagement is up 34% in the features we built. Considering it was the most complex project this team has done, I think we should be proud."),
    (366, 390, "Priya Nair", "Absolutely. This team executed under real pressure and delivered. Now let's make the next project even better. I'll write up a retro document with our action items today."),
]

for i, (start, end, speaker, text) in enumerate(t8_segments):
    db.add(TranscriptSegment(
        meeting_id=m8.id,
        speaker_name=speaker,
        start_time=float(start * 8),
        end_time=float(end * 8),
        text=text,
        sequence_order=i,
    ))

s8 = Summary(meeting_id=m8.id, overview="Post-launch retrospective for Project Phoenix (launched 6 weeks ago, engagement up 34%). What went well: daily cross-functional syncs, transparency via shared Slack, proof-of-concept approach, design-engineering collaboration from day one. What needs improvement: scope creep process, customer communication, and tooling fragmentation (now standardizing on Linear).")
db.add(s8)
db.flush()
for i, topic in enumerate(["Cross-functional Sync Success", "Scope Creep & Change Management", "Customer Communication Gaps", "Tooling Standardization (Linear)", "Project Results: +34% Engagement"]):
    db.add(KeyTopic(summary_id=s8.id, topic=topic, order_index=i))

db.add_all([
    ActionItem(meeting_id=m8.id, assignee_name="Priya Nair", text="Write up formal retrospective document with all action items", is_completed=True),
    ActionItem(meeting_id=m8.id, assignee_name="Priya Nair", text="Set up Linear for the next project and train the team before kickoff", is_completed=False),
    ActionItem(meeting_id=m8.id, assignee_name="Priya Nair", text="Create formal scope change process with impact assessment template", is_completed=False),
    ActionItem(meeting_id=m8.id, assignee_name="Sarah Chen", text="Develop customer communication plan for active projects going forward", is_completed=False),
    ActionItem(meeting_id=m8.id, assignee_name="James Wilson", text="Document the change management process for future project leads", is_completed=False),
])

db.add_all([
    Chapter(meeting_id=m8.id, title="Project Overview & Intro", start_time=0, order_index=0),
    Chapter(meeting_id=m8.id, title="What Went Well", start_time=128, order_index=1),
    Chapter(meeting_id=m8.id, title="What Needs Improvement", start_time=1128, order_index=2),
    Chapter(meeting_id=m8.id, title="Action Items & Next Steps", start_time=2688, order_index=3),
])

db.commit()
print("✅ Seed complete. Database populated with 8 realistic meetings.")
print(f"   Participants: {len(participants)}")
print("   Meetings: 8 (Product Planning, Standup, Sprint Review, Design Review, Client QBR, Architecture Review, Hiring, Retrospective)")
