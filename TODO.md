## Status Standards

**Format:** `[Backend Status, Frontend Status]`

**Status Levels:**
- `planned` - Feature is designed but not started
- `in_progress` - Currently being developed
- `developed` - Code written and functional
- `tested` - Unit/integration tests written and passing
- `polished` - UI refined, edge cases handled, production ready
- `N/A` - Not applicable for this component

**IMPORTANT:** Backend models without frontend UI are NOT considered functional features.
A feature is only truly "developed" when BOTH backend AND frontend are implemented and integrated.

**Completion Stages:**
1. Planning → Design the feature
2. Development → Write the code (BOTH backend + frontend)
3. Testing → Verify it works correctly (integration + unit tests)
4. Polish → Refine UX, handle edge cases, optimize, mobile ready
5. Documented → Add documentation if needed

---

## 🏛️ FOUR-LAYER ARCHITECTURE

{{app_name}} organizes story development into **four interconnected visualization layers**:

### 1. ⏰ TEMPORAL LAYER (Story Timeline)
**Status:** ✅ Developed & Functional

**Purpose:** Visualize story events in chronological order and their hierarchical relationships.

**Features:**
- Event hierarchy with recursive nesting (parent-child events)
- Expand/collapse event trees
- Event timeline ordering by date
- Character and group filtering on events
- Event CRUD operations with full-text descriptions

**Backend:** Event model with parent_event, event_date, involved_entities
**Frontend:** DiagramPage with recursive event layout, EventNode component, timeline visualization

**What Works:**
- Creating, editing, deleting events
- Hierarchical event structure (unlimited nesting)
- Filtering events by characters/groups
- Visual timeline with expand/collapse
- Event relationships and effects

---

### 2. 🌍 SPATIAL LAYER (Physical Locations)
**Status:** 🚧 Partially Developed - Needs Character-Location Tracking

**Purpose:** Visualize physical locations where story events occur and track character positions over time.

**Core Features Needed:**
- [x] Location CRUD with hierarchy (Kingdom > City > Tavern)
- [x] Location tags and categorization
- [x] Location history tracking (state changes over events)
- [ ] **Character-location tracking per event** ⭐ HIGH PRIORITY
- [ ] Spatial visualization showing location hierarchy
- [ ] "Who's where" view at any given event
- [ ] Location-based event filtering
- [ ] Character movement visualization

**Backend Status:**
- [x] Location model with parent_location hierarchy
- [x] LocationHistory model for temporal state tracking
- [x] LocationTag model for categorization
- [ ] CharacterLocation junction model (tracks which characters are where at each event)

**Frontend Status:**
- [x] CreateLocationModal, EditLocationModal
- [x] LocationsList component with hierarchical tree
- [ ] Spatial visualization component
- [ ] Character presence indicators on locations
- [ ] "At this event" location/character view

**Implementation Tasks:**

**A. Backend - Character-Location Tracking**
- [planned, N/A] Create CharacterLocation model:
  - Fields: character_id, location_id, event_id
  - Fields: arrival_reason, departure_reason
  - Fields: sequence_order (order of character movements)
  - Unique constraint: (character, event) - one location per character per event
- [planned, N/A] Add location_at_event() method to Character model
- [planned, N/A] Add characters_present() method to Location model
- [planned, N/A] Add API endpoints:
  - GET /characters/{id}/location-history/
  - GET /locations/{id}/characters-at-event/?event_id={id}
  - POST /character-locations/ (record character position)
  - GET /events/{id}/character-locations/ (who's where at this event)

**B. Frontend - Spatial View**
- [N/A, planned] Create SpatialViewPage component:
  - Hierarchical location visualization (tree or nested boxes)
  - Click location → Shows events that happened there
  - Timeline scrubber shows character positions at selected event
- [N/A, planned] Create CharacterLocationPanel:
  - For each character, show location at selected event
  - Movement history timeline
  - "Track character movement" button
- [N/A, planned] Add "Location" tab to event modals:
  - Set event location (where it happens)
  - Set character positions (who's where during this event)
  - Multi-select characters present at this location
- [N/A, planned] Create LocationMapView (future):
  - Visual map with location pins
  - Character avatars at locations
  - Click event → Highlights where it happened

**C. User Flows**
```
1. SET EVENT LOCATION
   Edit event → "Location" field → Select location
   → Shows full path: "Kingdom > City > Tavern"
   → Event node displays location badge

2. TRACK CHARACTER POSITIONS AT EVENT
   Edit event → "Character Locations" section
   → For each involved character:
      - Location dropdown (where is this character during this event?)
      - Auto-suggests event location as default
   → Save → Records CharacterLocation entries

3. VIEW SPATIAL LAYOUT
   Click "Spatial View" tab
   → Shows location hierarchy
   → Select event from timeline
   → Each location shows characters present at that event
   → Click character → Highlights their location

4. CHARACTER MOVEMENT TRACKING
   Click character in sidebar → "Movement History"
   → Timeline showing character's locations across events
   → Example: "Event 1-5: Kingdom Castle → Event 6-10: Forest → Event 11-15: Enemy Fortress"

5. FILTER EVENTS BY LOCATION
   Spatial view → Click location
   → Shows all events at this location
   → Shows timeline of what happened here
```

---

### 3. 💞 RELATIONS LAYER (Character Relationships)
**Status:** ✅ Developed & Functional

**Purpose:** Visualize and track relationships between characters over time.

**Features:**
- Relationship creation between entities
- Temporal relationship tracking (changes over events)
- Relationship history with intensity/type changes
- Relationship timeline view showing evolution
- Visual relationship arcs (graphs)
- Relationship web visualization

**Backend:**
- Relationship model with current state fields
- RelationshipHistory model for temporal tracking
- Temporal query API (state at event, history, arc data)

**Frontend:**
- RelationshipsSidebar with search and filtering
- CreateRelationshipModal, RecordRelationshipChangeModal
- RelationshipTimelineView showing relationship evolution
- Relationship edges on diagram

**What Works:**
- Creating relationships between characters
- Recording relationship changes at specific events
- Viewing relationship history and timeline
- Filtering by relationship type
- Visual arc showing relationship evolution

---

### 4. 📝 NARRATIVE LAYER (Text & Export)
**Status:** 🔴 Not Developed - Critical for Export

**Purpose:** Manage the actual narrative text, dialogue, chapters, and export to various formats.

**Core Features Needed:**
- [ ] Chapter and paragraph editing interface
- [ ] Dialogue editor linked to characters
- [ ] Text-event linking (which text describes which events)
- [ ] Multiple narrative formats (novel, screenplay, stage play, etc.)
- [ ] Format-specific export with proper styling
- [ ] POV (point of view) management
- [ ] Scene-to-text generation

**Backend Status:**
- [x] Chapter model exists (no UI)
- [x] Paragraph model exists (no UI)
- [ ] Dialogue model (needs creation)
- [ ] NarrativeFormat model (template system)
- [ ] POV tracking system

**Frontend Status:**
- [ ] Rich text editor for chapters/paragraphs
- [ ] Dialogue attribution interface
- [ ] Format selector and preview
- [ ] Export configuration UI
- [ ] Text-diagram linking visualization

**Implementation Tasks:**

**A. Backend - Narrative Text Models**
- [planned, N/A] Enhance Chapter model:
  - Add: chapter_type (prologue, main, epilogue, interlude)
  - Add: pov_character_id (which character's perspective)
  - Add: covered_events (ManyToMany to Event)
  - Add: chapter_order (sequence in final output)
- [planned, N/A] Enhance Paragraph model:
  - Add: paragraph_type (narration, dialogue, description, action)
  - Add: speaker_character_id (for dialogue attribution)
  - Add: linked_event_id (which event this text describes)
  - Add: emotional_tone (optional, for AI analysis)
- [planned, N/A] Create Dialogue model:
  - Fields: character_id (speaker)
  - Fields: text (what they say)
  - Fields: event_id (when they say it)
  - Fields: emotional_state, subtext
  - Fields: paragraph_id (link to containing paragraph)
  - Fields: dialogue_order (sequence in conversation)
- [planned, N/A] Create NarrativeFormat model:
  - Fields: format_name (Novel, Screenplay, Stage Play, Comic Script, etc.)
  - Fields: template_structure (JSON defining format rules)
  - Fields: style_rules (formatting guidelines)
  - Fields: is_default, user_id (custom formats)
- [planned, N/A] Create SceneBreak model:
  - Fields: chapter_id, position
  - Fields: break_type (scene_change, time_jump, pov_shift)
  - Fields: metadata (transition text, etc.)

**B. Backend - Export System**
- [planned, N/A] Create TextGenerationService:
  - Method: generate_novel(project_id, options)
  - Method: generate_screenplay(project_id, options)
  - Method: generate_stage_play(project_id, options)
  - Method: generate_comic_script(project_id, options)
  - Method: generate_summary(project_id, options)
- [planned, N/A] Create format templates:
  - Novel: Prose paragraphs, chapter headings, scene breaks
  - Screenplay: INT./EXT., character names (CAPS), action lines, dialogue
  - Stage Play: Act/Scene divisions, stage directions, character entrances
  - Comic Script: Page/panel structure, visual descriptions, captions
- [planned, N/A] Add export endpoints:
  - POST /generate-text/ (format, options) → Returns formatted text
  - GET /export/pdf/ (format, project_id)
  - GET /export/docx/ (format, project_id)
  - GET /export/fountain/ (screenplay only)
  - GET /export/epub/ (novel only)

**C. Frontend - Text Editing Interface**
- [N/A, planned] Create LiteraryViewPage component (new main tab):
  - Chapter list (sidebar)
  - Rich text editor (main area)
  - Linked events panel (shows which events this text covers)
- [N/A, planned] Create ChapterEditor component:
  - Rich text with formatting toolbar
  - Paragraph-by-paragraph editing
  - Dialogue highlighting (color-coded by character)
  - Event linking interface
- [N/A, planned] Create DialogueEditor component:
  - Character dropdown for each line
  - Quick character switching (keyboard shortcuts)
  - Voice profile hints (shows character's typical speech patterns)
  - Subtext/emotion annotations
- [N/A, planned] Create FormatSelectorModal:
  - Preview different formats side-by-side
  - Format-specific options:
    * Novel: POV (1st/3rd person), tense, chapter length
    * Screenplay: scene numbering, revision color
    * Stage Play: act structure, cast list generation
    * Comic Script: panel density, page count
  - Export button with format selection
- [N/A, planned] Create ExportConfigPanel:
  - Include/exclude chapters
  - Style preferences (font, margins, etc.)
  - Cover page, title page options
  - Table of contents generation
  - PDF/DOCX/TXT/ePub/Fountain format selector
- [N/A, planned] Create TextDiagramLinkingView:
  - Split screen: Text on left, diagram on right
  - Click paragraph → Highlights linked events
  - Drag event to paragraph to link
  - Shows coverage: which events have text, which don't

**D. User Flows**
```
1. WRITE CHAPTER TEXT
   Click "Literary" tab → "New Chapter"
   → Chapter editor opens:
      - Title field
      - POV character selector
      - Rich text editor (bold, italic, formatting)
      - Link to events: multi-select events covered in this chapter
   → Save → Chapter appears in chapter list

2. ADD DIALOGUE
   In chapter editor, type dialogue
   → Select dialogue text → Click "Mark as Dialogue"
   → Modal: Select speaker character
   → Text highlights in character's color
   → Saves as Dialogue object linked to character

3. LINK TEXT TO EVENTS
   Writing mode → Events panel on right
   → Drag event to paragraph
   → Creates link: "This paragraph describes Event #5"
   → Later: Generate missing text for unlinked events

4. CHOOSE EXPORT FORMAT
   Click "Export" button → FormatSelectorModal
   → Choose format: Novel, Screenplay, Stage Play, Comic Script, Summary
   → Configure options:
      * Novel: 3rd person, past tense, chapter breaks
      * Screenplay: Standard format, scene numbers on
   → Preview formatted output
   → Export as PDF / DOCX / ePub / Fountain

5. NOVEL FORMAT EXPORT
   Format: Novel → Options:
      - POV: Third person limited (Character X)
      - Chapters: Auto-break at major events
      - Include: Table of contents, chapter titles
      - Style: Professional manuscript (12pt, double-spaced)
   → Export → Downloads novel.docx
   → Properly formatted for submission/publishing

6. SCREENPLAY FORMAT EXPORT
   Format: Screenplay → Options:
      - Scene headings: Generate from event locations
      - Character names: ALL CAPS, centered
      - Dialogue: Proper margins (2.5" from left)
      - Action lines: Standard formatting
      - Page numbers: Bottom right
   → Export as .fountain (editable) or .pdf (final)

7. STAGE PLAY FORMAT EXPORT
   Format: Stage Play → Options:
      - Act breaks: Based on plot structure
      - Stage directions: Italic, parenthetical
      - Character list: Auto-generated from cast
      - Set descriptions: From location data
   → Export → stage_play.pdf

8. COMIC SCRIPT FORMAT EXPORT
   Format: Comic Script → Options:
      - Panel descriptions: From event descriptions
      - Dialogue: In captions or speech bubbles
      - Visual notes: Camera angles, expressions
      - Page layout: Suggested panel counts
   → Export → comic_script.pdf

9. AI-ASSISTED TEXT GENERATION
   Events without text → "Generate Text"
   → AI uses:
      - Event descriptions
      - Character voice profiles
      - Selected narrative format
      - Previous chapter style (consistency)
   → Generates draft text for review
   → Writer edits and refines
```

**E. Format-Specific Requirements**

**Novel Format:**
- Prose paragraphs with proper indentation
- Chapter headings (centered, new page)
- Scene breaks (*** or whitespace)
- No script-style dialogue tags
- Descriptive narration
- Past or present tense consistency
- POV consistency per chapter/section

**Screenplay Format:**
- Scene headings: INT./EXT. LOCATION - TIME
- Character names: CENTERED, ALL CAPS
- Dialogue: Character name, then dialogue below
- Parentheticals: (emotional direction)
- Action lines: Present tense, concise
- Transitions: CUT TO:, FADE IN:, FADE OUT:
- Page count ≈ runtime (1 page = 1 minute)
- Proper margins: 1.5" left, 1" right

**Stage Play Format:**
- Act and scene divisions: ACT I, SCENE 1
- Character entrances/exits: [JOHN enters from stage left]
- Stage directions: Italic, describe blocking
- Dialogue: Character name, colon, dialogue
- Set descriptions: Detailed at act start
- Cast list: At beginning
- Prop list: If needed

**Comic Script Format:**
- Page and panel numbers: PAGE 1, PANEL 1
- Panel descriptions: Visual composition, camera angle
- Character actions: What they're doing in panel
- Dialogue: Numbered by panel, in order
- Captions: Narration boxes
- SFX: Sound effects noted
- Splash pages: Full-page dramatic moments
- Pacing notes: For artist reference

---

## Currently Functional Features ✓

**Backend + Frontend Complete:**
- ✅ Projects (list, create, view with stats)
- ✅ Characters (CRUD, images, colors, aliases, filtering)
- ✅ Groups (CRUD, images, colors, aliases, membership management)
- ✅ Events (CRUD, recursive hierarchy, expand/collapse, filtering)
- ✅ Memberships (add/remove characters from groups)
- ✅ Interactive Diagram (ReactFlow with nodes, edges, sidebars)
- ✅ Text-to-Diagram AI (OpenAI integration with modal UI)

**Backend Exists, NO Frontend UI (Not Functional):**
- ❌ Branches (no branch switching UI)
- ❌ Commits (no commit history UI)
- ❌ Locations (no location management UI)
- ❌ Systems (no magic/tech system UI)
- ❌ Attachments (no file upload UI)
- ❌ Relationships (entity-to-entity relationships, no UI)
- ❌ Chapters & Paragraphs (no text editor UI)

---

### Project Setup

- [tested, developed] Set up Django REST API backend
- [tested, developed] Configure CORS to allow communication between frontend and backend
- [tested, developed] Set up initial project structure for both frontend and backend
- [planned, planned] Mobile-first responsive design improvements

### Version Control Models

- [developed, developed] Implement `Project` model (backend + frontend integrated)
- [developed, planned] Implement `Branch` model (backend exists, no UI)
- [developed, planned] Implement `Commit` model (backend exists, no UI)
- [developed, developed] Create API endpoints for `Project`, `Branch`, and `Commit`
- [planned, N/A] Write tests for version control models and endpoints
- [planned, planned] Frontend UI for branch switching and commit history visualization

**Note:** Branch/Commit models exist but are not usable without frontend UI

### Core Models

- [developed, N/A] Implement abstract `Entity` model (base class, no direct UI)
- [developed, planned] Implement abstract `EntityVersion` model (backend exists, no UI)
- [developed, developed] Implement `Character` model - FUNCTIONAL ✓
- [developed, developed] Implement `Group` model - FUNCTIONAL ✓
- [developed, developed] Implement `Alias` model - FUNCTIONAL (displayed in nodes) ✓
- [developed, developed] Implement `Event` model - FUNCTIONAL ✓
- [developed, developed] Create API endpoints for `Character`, `Group`, `Alias`, and `Event`
- [developed, planned] Implement `Location` model (backend exists, NO frontend UI yet)
- [developed, planned] Implement `System` model (backend exists, NO frontend UI yet)
- [developed, planned] Implement `Attachment` model (backend exists, NO frontend UI yet)
- [planned, N/A] Write tests for core models and endpoints

**Note:** Location, System, and Attachment models are NOT functional features yet - they need frontend implementation

### Relationship Models

- [developed, planned] Implement `Relationship` model (backend exists, NO frontend UI yet)
- [developed, developed] Implement `Membership` model - FUNCTIONAL (managed via Group modals) ✓
- [developed, developed] Create API endpoints for `Relationship` and `Membership`
- [planned, N/A] Write tests for relationship models and endpoints

**Note:** Relationship model needs frontend UI for creating/editing entity relationships

### Text-Based Models

- [developed, planned] Implement `Chapter` model (backend exists, NO frontend UI yet)
- [developed, planned] Implement `Paragraph` model (backend exists, NO frontend UI yet)
- [developed, planned] Create API endpoints for `Chapter` and `Paragraph`
- [planned, N/A] Write tests for text-based models and endpoints

**Note:** Chapter and Paragraph models are NOT functional yet - need text editor/viewer UI

### Key Features

- **Interactive Story Diagram**
    - [N/A, developed] Choose and integrate a graph visualization library (ReactFlow)
    - [N/A, developed] Implement frontend to display nodes (Characters, Events, etc.)
    - [N/A, developed] Implement recursive event hierarchy with expand/collapse
    - [N/A, developed] Implement creation, editing, and deletion of story elements
    - [N/A, developed] Character and Group sidebar filtering
    - [N/A, developed] Orthogonal edge routing (smoothstep)
    - [N/A, polished] Visual polish (colors, images for characters/groups)

- **Text-to-Diagram Conversion**
    - [developed, N/A] Integrate with OpenAI LLM
    - [developed, N/A] Implement text parsing to identify entities and relationships
    - [developed, N/A] Implement LLM logging for debugging
    - [developed, developed] Create text-to-diagram modal UI
    - [developed, developed] Generate story diagram from parsed text

- **Diagram-to-Text Conversion**
    - [planned, planned] Implement logic to generate a linear narrative from the diagram
    - [planned, planned] Ensure changes in the diagram are reflected in the generated text

### Comments and Annotations System

- **Backend Models**
    - [planned, N/A] Create `Comment` model (polymorphic to link to any entity/event/relationship)
        - Fields: content, author (user), created_at, updated_at
        - content_type and object_id for generic foreign key
        - comment_type: 'author' or 'ai'
    - [planned, N/A] Create `Annotation` model for inline text annotations
        - Fields: text_selection, comment, paragraph reference
    - [planned, N/A] Add API endpoints for comments CRUD operations
    - [planned, N/A] Add filtering by entity/event/relationship
    - [planned, N/A] Write tests for comment models and endpoints

- **Frontend Implementation**
    - [N/A, planned] Create CommentSidebar component
    - [N/A, planned] Add comment button/icon to all nodes (Events, Characters, Groups)
    - [N/A, planned] Create CommentModal for creating/viewing comments
    - [N/A, planned] Display AI vs Author comments with different styling
    - [N/A, planned] Add comment count badges to nodes
    - [N/A, planned] Implement comment threading (replies)
    - [N/A, planned] Add Redux slice for comments state

- **AI Comments Integration**
    - [planned, planned] Create service to generate AI comments on story elements
    - [planned, planned] Implement AI character analysis comments
    - [planned, planned] Implement AI plot suggestions
    - [planned, planned] Add "Ask AI about this" feature for any element

### Character-Event Experience System

- **Backend Models**
    - [planned, N/A] Create `EventExperience` junction model
        - Fields: event, character, emotional_impact, role_in_event
        - Fields: character_state_before, character_state_after
        - Fields: knowledge_gained, relationships_affected
        - Fields: physical_effects, psychological_effects
    - [planned, N/A] Update Event model to use EventExperience instead of simple ManyToMany
    - [planned, N/A] Create serializer for EventExperience with nested data
    - [planned, N/A] Add API endpoints for EventExperience CRUD
    - [planned, N/A] Write tests for experience tracking

- **Frontend Implementation**
    - [N/A, planned] Update EventNode to show character experiences
    - [N/A, planned] Create EventExperienceModal for detailed editing
    - [N/A, planned] Add emotional impact visualization (color coding)
    - [N/A, planned] Show character state changes in timeline
    - [N/A, planned] Create character journey view showing all experiences
    - [N/A, planned] Add filters by emotional impact level
    - [N/A, planned] Update Redux slice to handle EventExperience data

- **AI-Powered Analysis**
    - [planned, planned] Implement AI analysis of character emotional arcs
    - [planned, planned] Generate consistency warnings (character reactions)
    - [planned, planned] Suggest character growth opportunities
    - [planned, planned] Analyze relationship dynamics through events

### Text Generation and Export System

- **Backend - Generation Engine**
    - [planned, N/A] Create `TextFormat` model to store format templates
        - Formats: Novel, Screenplay, Stage Play, Comic Script, Summary
    - [planned, N/A] Implement `StoryRenderer` service class
        - Method: render_as_novel()
        - Method: render_as_screenplay()
        - Method: render_as_stage_play()
        - Method: render_as_comic_script()
    - [planned, N/A] Create Jinja2/Django templates for each format
    - [planned, N/A] Implement chapter ordering and scene generation
    - [planned, N/A] Add character dialogue formatting per format
    - [planned, N/A] Create API endpoint `/generate-text/` with format parameter

- **Novel Format**
    - [planned, N/A] Implement prose generation from events
    - [planned, N/A] Add chapter breaks and scene transitions
    - [planned, N/A] Include character descriptions and settings
    - [planned, N/A] Support POV selection (first/third person, which character)
    - [planned, planned] Generate descriptive paragraphs with AI assistance

- **Screenplay Format**
    - [planned, N/A] Implement standard screenplay formatting
        - Scene headings (INT./EXT., Location, Time)
        - Action lines
        - Character names (centered, caps)
        - Dialogue formatting
        - Parentheticals
        - Transitions (CUT TO, FADE IN, etc.)
    - [planned, N/A] Add scene numbering
    - [planned, N/A] Generate from event sequence
    - [planned, N/A] Export to Final Draft (.fdx) and Fountain (.fountain)

- **Stage Play Format**
    - [planned, N/A] Implement stage play conventions
        - Act and scene divisions
        - Character entrances/exits
        - Stage directions in italics
        - Dialogue with character names
    - [planned, N/A] Add cast list generation
    - [planned, N/A] Include setting descriptions

- **Comic Script Format**
    - [planned, N/A] Implement panel-based structure
        - Page and panel numbering
        - Panel descriptions
        - Character actions and expressions
        - Dialogue and captions
    - [planned, N/A] Add visual direction notes
    - [planned, N/A] Include splash page markers

- **Frontend - Generation UI**
    - [N/A, planned] Create TextGenerationModal component
    - [N/A, planned] Add format selector (dropdown with preview)
    - [N/A, planned] Implement generation settings panel
        - POV selection
        - Style preferences (tone, pacing)
        - Include/exclude specific events
        - Chapter/scene break preferences
    - [N/A, planned] Add live preview pane
    - [N/A, planned] Create export buttons (PDF, DOCX, TXT, format-specific)
    - [N/A, planned] Show generation progress indicator
    - [N/A, planned] Add regenerate with AI refinement option

- **AI Enhancement**
    - [planned, planned] Integrate AI to expand bare events into full scenes
    - [planned, planned] Add dialogue generation based on character personalities
    - [planned, planned] Implement style consistency checking
    - [planned, planned] Generate transitions between scenes
    - [planned, planned] Add description enhancement (settings, actions)
    - [planned, planned] Create character voice consistency analysis

- **Export Options**
    - [planned, planned] PDF export with proper formatting per format
    - [planned, planned] DOCX export (Microsoft Word)
    - [planned, planned] TXT plain text export
    - [planned, planned] Fountain format (.fountain) for screenplays
    - [planned, planned] Final Draft format (.fdx)
    - [planned, planned] ePub for novels
    - [planned, planned] HTML with CSS styling

---

## TEMPORAL DATA ARCHITECTURE ⏰

**CRITICAL PRINCIPLE: Everything in a story exists in TIME**

Stories unfold over time, and almost everything changes:
- Relationships evolve (strangers → friends → enemies)
- Locations change (tavern burns down, kingdom falls)
- Conflicts escalate and resolve
- Characters age, grow, change voice/personality
- Group memberships change
- Knowledge is gained at specific moments

**Time-Based Data Structure Pattern:**

```python
# WRONG: Static single state
class Relationship:
    type = "friend"  # What if they become enemies later?
    intensity = 5

# RIGHT: Temporal state history
class Relationship:
    # Current state
    current_type = "friend"
    current_intensity = 5

class RelationshipHistory:
    relationship = FK(Relationship)
    event = FK(Event)  # When the change happened
    type_at_this_time = "friend"
    intensity_at_this_time = 5
    changed_from_type = "stranger"
    changed_from_intensity = 1
    change_reason = "They fought together in battle"
```

**Implementation Strategy:**
1. **Main Model** - Holds current/latest state
2. **History Model** - Tracks changes over time (linked to events)
3. **Query API** - Get state "as of" any point in timeline
4. **Validation** - Detect jumps without proper transitions

---

## DETAILED FEATURE SPECIFICATIONS WITH VALUE SCORES

**Value Score System:**
- 🔥🔥🔥🔥🔥 (10/10) - Critical, game-changing feature
- 🔥🔥🔥🔥 (8/10) - High value, significant user benefit
- 🔥🔥🔥 (6/10) - Medium value, nice to have
- 🔥🔥 (4/10) - Low value, niche use case
- 🔥 (2/10) - Minimal value, optional polish

**Implementation Complexity:**
- 🟢 Easy (1-3 days)
- 🟡 Medium (1-2 weeks)
- 🟠 Hard (2-4 weeks)
- 🔴 Very Hard (1-2 months)

---

### 🎯 TIER 1: HIGH-VALUE, QUICK WINS

#### 1. Relationship Visualization System ⏰ TEMPORAL
**Value Score:** 🔥🔥🔥🔥🔥 (10/10)
**Complexity:** 🟠 Hard (2-3 weeks) - Increased due to temporal support
**Backend Status:** [developed, planned] - Model exists, needs temporal enhancement!

**Why This Matters:**
- Character relationships are core to any story
- Relationships CHANGE over time (strangers → friends → enemies → allies)
- Backend already exists (Relationship model) but needs temporal support
- Visual display makes complex webs understandable
- Timeline scrubbing shows relationship evolution

**User Flow:**

```
1. CREATE RELATIONSHIP
   User clicks character node → "Add Relationship" button
   → Modal opens with:
      - "To" character dropdown
      - Starting event: dropdown (when relationship begins)
      - Initial type: dropdown (Family, Romantic, Professional, Antagonist, Mentor, Friend, Enemy, Ally, Neutral, Custom)
      - Initial intensity: slider (1-10, weak to strong)
      - Initial status: Active/Dormant
      - Description: text area (why/how they met)
   → Click "Create"
   → Edge appears on diagram between characters
   → Edge color/style varies by relationship type

2. RECORD RELATIONSHIP CHANGE
   Click relationship edge → "Record Change" button
   → Modal:
      - At event: dropdown (which event causes the change)
      - New type: dropdown (can change type over time)
      - New intensity: slider (relationships strengthen/weaken)
      - New status: Active/Dormant/Ended
      - Change reason: text (what happened to cause this change)
   → Save → Creates RelationshipHistory entry
   → Diagram edge updates based on timeline position

3. VIEW RELATIONSHIP HISTORY
   Click edge → Side panel shows:
      - Current state (at latest event)
      - "Timeline" tab: List of all changes:
        * Event #5: "Strangers" (intensity 0) → Met at party
        * Event #12: "Friends" (intensity 5) → Bonded over shared trauma
        * Event #20: "Enemies" (intensity 8) → Betrayal revealed
        * Event #35: "Allies" (intensity 7) → Common enemy united them
   → Click any history entry → Jumps to that event in diagram

4. TIMELINE SCRUBBING
   Diagram has timeline slider at bottom
   → Drag slider to any point in story
   → Relationship edges update to show state at that time
   → Example: Slider at Event #15 shows them as "Friends"
   → Slider at Event #25 shows them as "Enemies"
   → Edge color/thickness changes dynamically

5. RELATIONSHIP ARC VISUALIZATION
   Click relationship → "View Arc" button
   → Line graph:
      - X-axis: Story events (timeline)
      - Y-axis: Relationship intensity (-10 to +10, negative = antagonistic)
      - Line color changes when type changes
      - Annotations show key events that changed relationship
   → See at a glance: rise, fall, reconciliation patterns

6. RELATIONSHIP WEB VIEW
   Click "Relationship Web" button → Diagram mode changes
   → Shows ONLY characters and relationship edges
   → Timeline slider still active
   → Scrub through time to see network evolution
   → Color-coded by relationship type
   → Thickness = relationship intensity at selected time

7. FILTER BY RELATIONSHIP TYPE & TIME
   Sidebar toggle: "Show only family relationships"
   → Grays out non-family edges
   → Can multi-select types
   → Time range filter: "Events 1-20" shows relationships during that period

8. RELATIONSHIP CHANGE DETECTION (AI)
   AI scans events for relationship changes
   → Flags: "Event #18: John and Mary are friendly, but no relationship change recorded"
   → Suggests: "Should this event change their relationship status?"
   → Click "Accept" → Creates relationship change automatically
```

**Backend Implementation - TEMPORAL SUPPORT:**
- [developed, N/A] Relationship model exists ✓ (needs enhancement)
- [planned, N/A] Add current state fields to Relationship:
  - current_type, current_intensity, current_status
  - started_event_id (when relationship began)
  - ended_event_id (nullable, when relationship ended)
- [planned, N/A] **Create RelationshipHistory model** (NEW - KEY FOR TEMPORAL):
  - Fields: relationship_id (FK)
  - Fields: event_id (FK - when this change happened)
  - Fields: type_at_this_time, intensity_at_this_time, status_at_this_time
  - Fields: changed_from_type, changed_from_intensity (track delta)
  - Fields: change_reason (text - why did it change)
  - Fields: sequence_order (integer - order of changes)
- [planned, N/A] Add Relationship model methods:
  - get_state_at_event(event_id) → returns type/intensity at that point
  - get_history() → returns all changes chronologically
  - detect_missing_transitions() → finds gaps in timeline
- [planned, N/A] **Add temporal query endpoint:**
  - GET /relationships/{id}/state/?at_event={event_id}
  - GET /relationships/{id}/history/
  - GET /relationships/{id}/arc/ (data for graph visualization)
  - POST /relationships/{id}/record-change/ (add history entry)
- [planned, N/A] Add ViewSet actions for relationship suggestions
- [planned, N/A] Write tests for temporal relationship queries

**Frontend Implementation - TEMPORAL SUPPORT:**
- [N/A, planned] Create RelationshipEdge component (custom edge styling)
  - Edge style changes based on timeline position
  - Animated transition when scrubbing timeline
- [N/A, planned] Create CreateRelationshipModal (with starting event)
- [N/A, planned] Create RecordRelationshipChangeModal (key for temporal)
- [N/A, planned] Create RelationshipHistoryPanel:
  - Timeline of all relationship changes
  - Click to jump to event
  - Visual arc graph
- [N/A, planned] Create TimelineScrubber component:
  - Slider at bottom of diagram
  - Drag to any point in story
  - All temporal data updates (relationships, locations, conflicts, etc.)
- [N/A, planned] Add relationship panel to character detail view
- [N/A, planned] Implement relationship web view mode with timeline
- [N/A, planned] Create RelationshipArcChart (line graph over time)
- [N/A, planned] Add relationship type filter to sidebar with time range
- [N/A, planned] Add Redux slice for relationships with temporal state:
  - Current timeline position
  - Relationship states at current position
  - History data for all relationships
- [N/A, planned] Style edges by relationship type with intensity variation:
  - Family: blue, solid, thickness = intensity
  - Romantic: red, dashed, thickness = intensity
  - Antagonist: orange, jagged, intensity affects color saturation
  - Mentor: purple, thick arrow
  - Friend: green, thin
  - Enemy: dark red, aggressive style
  - Ally: yellow/gold, strong line
  - Neutral: gray, dotted
  - Professional: steel blue, formal

**AI Enhancement - TEMPORAL AWARE:**
- [planned, planned] Auto-suggest relationships from event descriptions
- [planned, planned] **Detect relationship changes over events** (KEY)
  - Scan event descriptions for: "they became friends", "betrayed", "fell in love"
  - Suggest creating relationship change at that event
- [planned, planned] Flag inconsistent relationships
  - "Event #10: They're enemies, but Event #15 they trust each other - missing transition?"
- [planned, planned] Analyze relationship pacing
  - "This relationship escalates too quickly (strangers to lovers in 2 events)"
  - "This relationship is static for 50 events - suggest development"
- [planned, planned] Generate relationship arc summaries
  - "John & Mary: Met as strangers → became friends through shared danger → romantic tension → lovers → conflict → reconciliation"

---

#### 2. Location Management & Integration
**Value Score:** 🔥🔥🔥🔥 (9/10)
**Complexity:** 🟡 Medium (1-2 weeks)
**Backend Status:** [developed, planned] - Model exists, needs frontend!

**Why This Matters:**
- Essential for fantasy/sci-fi world-building
- Backend already exists (Location model with hierarchy)
- Every event happens somewhere
- Enables spatial reasoning about story

**User Flow:**

```
1. CREATE LOCATION
   Click "Locations" tab → "New Location" button
   → Modal opens:
      - Name: text input
      - Description: rich text editor
      - Parent location: dropdown (for hierarchy)
         Example: "Tavern" → parent "City" → parent "Kingdom"
      - Map image: upload/URL
      - Coordinates: optional text (lat/long or fictional coords)
      - Tags: multi-select (indoor, outdoor, public, private, dangerous, safe)
   → Click "Create"
   → Location appears in locations list

2. LINK EVENT TO LOCATION
   Edit event → "Location" dropdown appears
   → Select from hierarchical list
   → Shows full path: "Kingdom > City > Tavern"
   → Event node displays location icon/badge

3. LOCATION NODE VIEW
   Toggle "Show Locations as Nodes"
   → Location nodes appear on diagram
   → Events connected to their locations
   → Location hierarchy shown with nested layout

4. LOCATION DETAIL VIEW
   Click location in list → Side panel opens:
      - Location info
      - "Events here" section (list of linked events)
      - "Characters present" (derived from events)
      - Map/image display
      - Sub-locations list

5. MAP VIEW (Future enhancement)
   Click "Map View" → Visual map layout
   → Locations positioned on map image
   → Click location → Shows events that happened there
   → Timeline slider → See character movements over time

6. FILTER BY LOCATION
   Sidebar: "Filter by Location"
   → Hierarchical checkbox list
   → Selecting "City" includes all sub-locations
   → Diagram shows only events at selected locations
```

**Backend Implementation:**
- [developed, N/A] Location model exists ✓
- [planned, N/A] Add tags field (ManyToManyField to LocationTag)
- [planned, N/A] Create LocationTag model (name, color)
- [planned, N/A] Add event.location foreign key
- [planned, N/A] Add API endpoint for location hierarchy tree
- [planned, N/A] Add filtering events by location
- [planned, N/A] Write tests for location operations

**Frontend Implementation:**
- [N/A, planned] Create LocationsList component (sidebar tab)
- [N/A, planned] Create CreateLocationModal with hierarchy selector
- [N/A, planned] Create EditLocationModal
- [N/A, planned] Create LocationNode component (optional diagram display)
- [N/A, planned] Add location field to event modals (hierarchical dropdown)
- [N/A, planned] Create LocationDetailPanel component
- [N/A, planned] Add location filter to sidebar with hierarchy checkboxes
- [N/A, planned] Add location badge to EventNode (small icon + name)
- [N/A, planned] Add Redux slice for locations
- [N/A, planned] Implement hierarchical tree selector component

**AI Enhancement:**
- [planned, planned] Auto-extract locations from text-to-diagram
- [planned, planned] Suggest location for events based on context
- [planned, planned] Flag continuity errors (character in two places at once)

---

#### 3. Scene Cards / Beat Sheet System
**Value Score:** 🔥🔥🔥🔥🔥 (10/10)
**Complexity:** 🟡 Medium (2 weeks)
**Backend Status:** [planned, planned] - New feature

**Why This Matters:**
- Industry-standard outlining method (Save the Cat, Blake Snyder)
- Lighter-weight than full events for early planning
- Visual card-based interface is intuitive
- Bridges gap between outline and full story

**User Flow:**

```
1. ACCESS BEAT SHEET MODE
   Click "Beat Sheet" tab (alongside Diagram tab)
   → Shows index card grid view
   → Each card is a scene/beat
   → Organized in columns by act/section

2. CREATE SCENE CARD
   Click "+" button or press 'N' (new)
   → Inline card creation appears:
      - Title: text input
      - Description: text area (short, 1-3 sentences)
      - Beat type: dropdown
        * Setup beats: Hook, Inciting Incident, Setup
        * Midpoint beats: Midpoint, Rising Action, Pinch Point
        * Resolution beats: Dark Night, Climax, Resolution
      - POV character: dropdown
      - Location: dropdown (if locations enabled)
      - Scene purpose: dropdown (Action, Exposition, Character Development, Plot Twist, etc.)
      - Notes: text area
      - Color: color picker (for visual grouping)
   → Press Enter or click "Create"
   → Card appears in appropriate column

3. ORGANIZE CARDS
   Drag and drop cards:
      - Vertically within act to reorder
      - Horizontally between acts to restructure
   → Auto-saves position
   → Number badges update automatically (Scene 1, 2, 3...)

4. EXPAND CARD TO EVENT
   Right-click card → "Convert to Full Event"
   → Creates full Event object with event hierarchy
   → Retains all card data
   → Can link characters, add sub-events
   → Card remains as "anchor" - clicking navigates to diagram

5. VIEW MODES
   Grid view (default): Cards in columns by act
   List view: Linear list with collapse/expand
   Timeline view: Horizontal timeline with cards
   Story circle view: Cards arranged in circle (Hero's Journey)

6. BEAT SHEET TEMPLATES
   Click "Use Template" → Choose:
      - Three Act Structure (Setup, Confrontation, Resolution)
      - Save the Cat (15 beats)
      - Hero's Journey (12 stages)
      - Seven Point Story Structure
      - Custom (define your own)
   → Creates placeholder cards
   → Fill in as you plan

7. PRINT/EXPORT BEAT SHEET
   Click "Export" → Options:
      - PDF (printable index cards, 4x6)
      - Image (for mood boards)
      - Markdown (for notes)
      - Import to diagram (convert all to events)

8. COLLABORATION ON BEAT SHEET
   Share beat sheet link (read-only or edit)
   → Collaborators can add cards
   → Comments on cards
   → Vote on scenes (keep/cut/revise)
```

**Backend Implementation:**
- [planned, N/A] Create SceneCard model:
  - Fields: title, description, card_order, act_number
  - Fields: beat_type, pov_character_id, location_id
  - Fields: scene_purpose, color, notes
  - Fields: project_id, parent_card_id (for nesting)
  - Fields: converted_to_event_id (nullable, tracks conversion)
- [planned, N/A] Create BeatSheetTemplate model:
  - Fields: name, description, is_default, user_id
  - Fields: template_structure (JSON with beat definitions)
- [planned, N/A] Create SceneCardSerializer
- [planned, N/A] Create ViewSet with reordering endpoint
- [planned, N/A] Add endpoint for converting card to event
- [planned, N/A] Add endpoint for applying template
- [planned, N/A] Write tests for scene card operations

**Frontend Implementation:**
- [N/A, planned] Create BeatSheetPage component (new page)
- [N/A, planned] Create SceneCard component (draggable card)
- [N/A, planned] Create ActColumn component (drop zone)
- [N/A, planned] Create CreateSceneCardModal (quick create)
- [N/A, planned] Implement drag-and-drop with react-beautiful-dnd
- [N/A, planned] Create BeatSheetTemplateModal (choose template)
- [N/A, planned] Create view mode switcher (grid/list/timeline/circle)
- [N/A, planned] Add export functionality (PDF, image, markdown)
- [N/A, planned] Create print stylesheet for index card format
- [N/A, planned] Add Redux slice for scene cards
- [N/A, planned] Implement auto-save on drag
- [N/A, planned] Add keyboard shortcuts (N=new, E=edit, D=delete)

**AI Enhancement:**
- [planned, planned] Generate beat sheet from existing events
- [planned, planned] Suggest beat types based on position in story
- [planned, planned] Analyze pacing (too many slow scenes in a row)
- [planned, planned] Suggest scene purposes based on description
- [planned, planned] Generate scene card descriptions from titles

---

#### 4. Attachment & Reference Files System
**Value Score:** 🔥🔥🔥🔥 (8/10)
**Complexity:** 🟢 Easy (3-5 days)
**Backend Status:** [developed, planned] - Model exists!

**Why This Matters:**
- Writers accumulate tons of reference material
- Backend already exists (Attachment model)
- Keep everything organized in one place
- Visual inspiration boards popular with creatives

**User Flow:**

```
1. ATTACH FILE TO CHARACTER
   Edit character → "Attachments" tab
   → Drag & drop files or click "Upload"
   → Supports: images, PDFs, audio, video, docs
   → Each file shows:
      - Thumbnail (if image)
      - File name, size, type
      - Caption/description field
      - Tags (reference, inspiration, photo, voice, costume, etc.)
   → Click file → Preview modal opens

2. ATTACH FILE TO EVENT
   Edit event → "Attachments" tab
   → Same upload interface
   → Tag with: location photo, scene inspiration, music, etc.

3. ATTACH FILE TO LOCATION
   Edit location → "Map/Photos" tab
   → Upload map images, location photos
   → Multiple images create gallery
   → Set one as primary (shows in location node)

4. ATTACHMENT LIBRARY
   Click "Library" in main nav
   → Shows ALL attachments across project
   → Filter by:
      - File type (images, docs, audio, video)
      - Attached to (characters, events, locations)
      - Tags
      - Date uploaded
   → Search by filename or caption
   → Grid view (thumbnails) or list view

5. INSPIRATION BOARD VIEW
   Library → Toggle "Board View"
   → Pinterest-style masonry layout
   → Images displayed large
   → Click → Shows what it's attached to
   → Drag to rearrange (visual grouping)

6. QUICK ATTACH FROM LIBRARY
   Editing any entity → "Attach Existing File"
   → Modal shows library
   → Click to attach without re-uploading
   → One file can attach to multiple entities

7. BULK OPERATIONS
   Library → Select multiple files (checkbox)
   → Bulk actions:
      - Tag all
      - Attach to entity
      - Download as ZIP
      - Delete
```

**Backend Implementation:**
- [developed, N/A] Attachment model exists ✓
- [planned, N/A] Add tags field (ManyToManyField to AttachmentTag)
- [planned, N/A] Create AttachmentTag model
- [planned, N/A] Add caption field to Attachment
- [planned, N/A] Add thumbnail generation for images (Django ImageKit)
- [planned, N/A] Add file type detection (image, pdf, audio, video, doc)
- [planned, N/A] Add API endpoint for attachment library (filtering, search)
- [planned, N/A] Add endpoint for bulk operations
- [planned, N/A] Implement file storage (local or S3)
- [planned, N/A] Write tests for attachment operations

**Frontend Implementation:**
- [N/A, planned] Add "Attachments" tab to edit modals
- [N/A, planned] Create FileUploadZone component (drag & drop)
- [N/A, planned] Create AttachmentCard component (thumbnail + metadata)
- [N/A, planned] Create AttachmentLibraryPage
- [N/A, planned] Create AttachmentPreviewModal (lightbox for images, viewer for PDFs)
- [N/A, planned] Implement grid view and masonry board view
- [N/A, planned] Add attachment filter sidebar
- [N/A, planned] Implement file search
- [N/A, planned] Create bulk selection UI with actions
- [N/A, planned] Add Redux slice for attachments
- [N/A, planned] Implement thumbnail lazy loading

**AI Enhancement:**
- [planned, planned] Auto-tag images (AI image recognition)
- [planned, planned] Suggest relevant attachments based on context
- [planned, planned] OCR on PDFs to make them searchable

---

### 🎯 TIER 2: HIGH-VALUE, MORE COMPLEX

#### 5. Plot Thread Tracking System
**Value Score:** 🔥🔥🔥🔥🔥 (10/10)
**Complexity:** 🟠 Hard (3 weeks)
**Backend Status:** [planned, planned] - New feature

**Why This Matters:**
- Essential for complex stories with multiple plot lines
- Ensures all threads introduced are resolved
- Visual distinction between A-plot, B-plot, subplots
- Prevents "orphaned" plot threads

**User Flow:**

```
1. CREATE PLOT THREAD
   Click "Plot Threads" panel → "New Thread"
   → Modal:
      - Thread name: "Romance between John & Mary"
      - Thread type: A-Plot, B-Plot, C-Plot, Subplot
      - Color: color picker (for visual coding)
      - Description: what this thread is about
      - Status: Active, Resolved, Abandoned
      - Priority: High, Medium, Low
   → Create → Thread appears in list

2. ASSIGN EVENTS TO THREADS
   Edit event → "Plot Threads" multi-select
   → Check threads this event belongs to
   → Event can belong to multiple threads
   → Save → Event node shows thread color badges

3. VISUALIZE PLOT THREADS
   Diagram view → Thread visualization ON
   → Each event shows colored badges for its threads
   → Can filter: "Show only A-Plot events"
   → Thread color indicator line connects events in same thread

4. THREAD TIMELINE VIEW
   Click "Thread Timeline" button
   → Horizontal lanes, one per thread
   → Events arranged chronologically within lanes
   → See gaps: "Thread X disappears for 10 events"
   → Flag warnings: "Thread Y not resolved"

5. THREAD DETAIL VIEW
   Click thread in list → Side panel:
      - Thread info
      - All events in this thread (chronological)
      - Characters involved
      - Thread status (introduced, rising, peak, resolution)
      - AI analysis: "This thread has strong start but weak resolution"

6. THREAD WEAVING
   Click "Weave Threads" button
   → Shows all threads overlaid
   → Highlights where threads intersect (same event)
   → Ideal weaving: threads intersect at key moments
   → Warning: threads never intersect (disconnected)

7. THREAD CHECKLIST
   Before finishing story, click "Thread Audit"
   → Lists all threads with status:
      ✅ "Main romance arc: Introduced, developed, resolved"
      ⚠️  "Mystery subplot: Introduced but never resolved"
      ❌ "Villain's motivation: Never fully explained"
   → Click warning → Navigate to relevant events
```

**Backend Implementation:**
- [planned, N/A] Create PlotThread model:
  - Fields: name, description, thread_type, color
  - Fields: status (active, resolved, abandoned)
  - Fields: priority, project_id
  - Fields: introduction_event_id, resolution_event_id (nullable)
- [planned, N/A] Add Event.plot_threads ManyToManyField
- [planned, N/A] Create PlotThreadSerializer
- [planned, N/A] Create ViewSet with thread analysis endpoints
- [planned, N/A] Add endpoint: get_thread_timeline (events by thread)
- [planned, N/A] Add endpoint: analyze_thread_status (AI-powered)
- [planned, N/A] Add endpoint: thread_audit (check all threads)
- [planned, N/A] Write tests for plot thread operations

**Frontend Implementation:**
- [N/A, planned] Create PlotThreadsPanel component (sidebar)
- [N/A, planned] Create CreatePlotThreadModal
- [N/A, planned] Create EditPlotThreadModal
- [N/A, planned] Add plot threads multi-select to event modals
- [N/A, planned] Display thread badges on EventNode (colored dots/pills)
- [N/A, planned] Create ThreadTimelineView component
- [N/A, planned] Create ThreadWeavingView (visual thread overlay)
- [N/A, planned] Create ThreadDetailPanel
- [N/A, planned] Create ThreadAuditModal (checklist)
- [N/A, planned] Implement thread filtering in diagram
- [N/A, planned] Add thread color coding to edges
- [N/A, planned] Add Redux slice for plot threads
- [N/A, planned] Implement thread gap detection visualization

**AI Enhancement:**
- [planned, planned] Auto-suggest which thread an event belongs to
- [planned, planned] Detect unresolved threads
- [planned, planned] Suggest where threads should intersect
- [planned, planned] Analyze thread pacing (too slow/fast)
- [planned, planned] Generate thread summary for each thread

---

#### 6. Character Voice Profiles
**Value Score:** 🔥🔥🔥🔥 (8/10)
**Complexity:** 🟡 Medium (1-2 weeks)
**Backend Status:** [planned, planned] - New feature

**Why This Matters:**
- Consistent character voice is crucial for believability
- Helps writers remember how each character speaks
- AI can reference profiles when generating dialogue
- Prevents characters "sounding the same"

**User Flow:**

```
1. CREATE VOICE PROFILE
   Edit character → "Voice Profile" tab
   → Form with sections:

   A) BASIC VOICE ATTRIBUTES
      - Education level: dropdown (elementary, high school, college, advanced)
      - Socioeconomic background: text
      - Regional accent: text (e.g., "Southern drawl", "Cockney")
      - Age-appropriate speech: toggle (uses slang, formal, etc.)

   B) VOCABULARY & LANGUAGE
      - Typical vocabulary: "Simple", "Average", "Advanced", "Archaic"
      - Favorite words/phrases: tag input ("Indeed", "You know what I mean")
      - Words they never use: tag input (profanity, technical jargon, etc.)
      - Catchphrase: text input

   C) SPEECH PATTERNS
      - Sentence structure: "Short and choppy", "Long and flowing", "Fragment-heavy"
      - Uses contractions: Yes/No/Sometimes
      - Grammar quirks: text (e.g., "Double negatives", "Switches tenses")
      - Verbal tics: text (e.g., "Um, ah, you see")

   D) TONE & EMOTION
      - Default tone: dropdown (Sarcastic, Earnest, Playful, Serious, etc.)
      - Emotional range: "Explosive", "Reserved", "Balanced"
      - How they express anger: text
      - How they express joy: text
      - How they express fear: text

   E) DIALOGUE EXAMPLES
      - Add sample dialogue lines that exemplify this character
      - Tag by emotion/situation
      - Reference page (for published characters)

2. USE VOICE PROFILE IN WRITING
   Writing dialogue → Click "Voice Check" button
   → AI compares dialogue to voice profile
   → Highlights: "This word is too formal for this character"
   → Suggests: "Try: 'ain't' instead of 'is not'"

3. VOICE COMPARISON
   Select multiple characters → "Compare Voices"
   → Side-by-side comparison
   → Highlights: "These characters sound too similar"
   → Suggestions to differentiate

4. DIALOGUE GENERATION WITH VOICE
   Right-click event → "Generate Dialogue"
   → Modal: Select characters in scene
   → AI generates dialogue using voice profiles
   → Output matches each character's unique voice

5. VOICE PROFILE LIBRARY
   Click "Voice Templates" → Pre-made profiles:
      - The Scholar (formal, precise)
      - The Soldier (direct, military jargon)
      - The Street Kid (slang, contractions)
      - The Aristocrat (formal, antiquated)
   → Click to apply to character → Customize

6. VOICE EVOLUTION
   Track voice changes over story:
   → "Young naive voice" → "Hardened cynical voice"
   → Tag events where voice changes
   → AI flags sudden voice shifts without explanation
```

**Backend Implementation:**
- [planned, N/A] Create CharacterVoiceProfile model:
  - Fields: character_id (OneToOneField)
  - Fields: education_level, socioeconomic_background, accent
  - Fields: vocabulary_level, favorite_phrases (JSON), avoid_words (JSON)
  - Fields: sentence_structure, uses_contractions, grammar_quirks
  - Fields: verbal_tics, default_tone, emotional_range
  - Fields: anger_expression, joy_expression, fear_expression
  - Fields: sample_dialogue (JSON array)
- [planned, N/A] Create VoiceProfileTemplate model (pre-made templates)
- [planned, N/A] Create VoiceProfileSerializer
- [planned, N/A] Add API endpoint for voice comparison
- [planned, N/A] Add AI endpoint for dialogue generation with voice
- [planned, N/A] Add AI endpoint for voice checking
- [planned, N/A] Write tests for voice profile operations

**Frontend Implementation:**
- [N/A, planned] Create VoiceProfileTab component (in character edit)
- [N/A, planned] Create comprehensive voice profile form (multi-section)
- [N/A, planned] Create VoiceTemplateModal (choose template)
- [N/A, planned] Create VoiceComparisonModal (side-by-side)
- [N/A, planned] Create DialogueGeneratorModal (uses voices)
- [N/A, planned] Create VoiceCheckPanel (highlights issues)
- [N/A, planned] Add voice profile indicator to CharacterNode (icon if complete)
- [N/A, planned] Add Redux slice for voice profiles
- [N/A, planned] Create reusable tag input component (favorite phrases)

**AI Enhancement:**
- [planned, planned] Analyze existing dialogue to suggest voice profile
- [planned, planned] Generate dialogue that matches voice profile
- [planned, planned] Check dialogue against voice profile (consistency)
- [planned, planned] Suggest voice profile differences for character diversity
- [planned, planned] Detect voice evolution over story

---

### 🎯 TIER 3: ADVANCED FEATURES

#### 7. Conflict Tracker System
**Value Score:** 🔥🔥🔥🔥 (8/10)
**Complexity:** 🟠 Hard (3 weeks)
**Backend Status:** [planned, planned] - New feature

**Why This Matters:**
- Conflict drives story - no conflict, no story
- Track internal vs external conflicts
- Ensure conflicts escalate and resolve properly
- Visualize dramatic structure

**User Flow:**

```
1. CREATE CONFLICT
   Click "Conflicts" panel → "New Conflict"
   → Modal:
      - Conflict name: "John's guilt over past"
      - Type: Internal / External
      - Category (if external): Man vs Man, Man vs Nature, Man vs Society, Man vs Technology
      - Character: who experiences this conflict
      - Opponent: who/what opposes (another character, nature, self, etc.)
      - Stakes: what's at risk
      - Current intensity: slider (1-10)
      - Status: Introduced, Rising, Peak, Falling, Resolved

2. LINK CONFLICT TO EVENTS
   Edit event → "Conflicts" section
   → Select conflicts affected by this event
   → For each conflict, mark:
      - Escalates conflict (+)
      - Maintains conflict (=)
      - Resolves conflict (✓)
      - Intensity change: slider
   → Event node shows conflict badges

3. CONFLICT ARC VISUALIZATION
   Click conflict in list → "View Arc"
   → Line graph showing intensity over events
   → X-axis: story progression (events)
   → Y-axis: conflict intensity
   → Ideal arc: rises, peaks near climax, resolves
   → Flags:
      - "Conflict never escalates"
      - "Conflict introduced but forgotten"
      - "Sudden resolution without buildup"

4. CONFLICT MATRIX
   Click "Conflict Matrix" view
   → Grid: Characters (rows) × Conflict Types (columns)
   → Each cell shows:
      - Number of conflicts
      - Active conflicts (colored dots)
   → Reveals:
      - "Character X has no internal conflicts"
      - "Too many Man vs Man, no other types"

5. CONFLICT TIMELINE
   Shows all conflicts on timeline
   → Stacked lines showing intensity over time
   → See how conflicts overlap and interact
   → Ideally: some conflicts active at all times
   → Warning: too many conflicts simultaneously (overwhelming)

6. CONFLICT RESOLUTION CHECKLIST
   Before ending story → "Conflict Audit"
   → Lists all conflicts:
      ✅ Main conflict: Properly escalated and resolved
      ⚠️  Secondary conflict: Resolved too easily
      ❌ Character's fear: Never addressed
   → Click → Jump to relevant events

7. NESTED CONFLICTS
   Conflicts can have sub-conflicts:
   → Main: "John must save the world"
      → Sub: "John's team doesn't trust him"
      → Sub: "John doubts his own abilities"
   → Resolving sub-conflicts contributes to main conflict
```

**Backend Implementation:**
- [planned, N/A] Create Conflict model:
  - Fields: name, conflict_type (internal/external)
  - Fields: category (man_vs_man, man_vs_nature, etc.)
  - Fields: character_id, opponent_id (nullable, can be character or text)
  - Fields: stakes, current_intensity (1-10)
  - Fields: status (introduced, rising, peak, falling, resolved)
  - Fields: parent_conflict_id (for nesting)
  - Fields: project_id
- [planned, N/A] Create EventConflict junction model:
  - Fields: event_id, conflict_id
  - Fields: effect (escalates, maintains, resolves)
  - Fields: intensity_change (integer, -10 to +10)
- [planned, N/A] Create ConflictSerializer
- [planned, N/A] Add API endpoint: get_conflict_arc (intensity over events)
- [planned, N/A] Add API endpoint: conflict_matrix (character × type grid)
- [planned, N/A] Add AI endpoint: analyze_conflict_structure
- [planned, N/A] Write tests for conflict tracking

**Frontend Implementation:**
- [N/A, planned] Create ConflictsPanel component (sidebar)
- [N/A, planned] Create CreateConflictModal
- [N/A, planned] Create EditConflictModal with nested conflict support
- [N/A, planned] Add conflicts section to event modals (select + effect)
- [N/A, planned] Display conflict badges on EventNode
- [N/A, planned] Create ConflictArcChart component (line graph)
- [N/A, planned] Create ConflictMatrixView component (grid)
- [N/A, planned] Create ConflictTimelineView component (stacked lines)
- [N/A, planned] Create ConflictAuditModal (checklist)
- [N/A, planned] Add Redux slice for conflicts
- [N/A, planned] Implement Chart.js or Recharts for visualizations

**AI Enhancement:**
- [planned, planned] Auto-detect conflicts from event descriptions
- [planned, planned] Suggest conflict escalation opportunities
- [planned, planned] Analyze conflict pacing and structure
- [planned, planned] Flag unresolved conflicts
- [planned, planned] Suggest conflict types character needs

---

#### 8. Continuity Checker (AI-Powered)
**Value Score:** 🔥🔥🔥🔥🔥 (10/10)
**Complexity:** 🔴 Very Hard (1-2 months)
**Backend Status:** [planned, planned] - New feature with heavy AI

**Why This Matters:**
- Catching continuity errors manually is tedious and error-prone
- Readers/viewers notice inconsistencies
- Professional editors charge to do this
- AI can check 24/7 as you write

**User Flow:**

```
1. RUN CONTINUITY CHECK
   Click "Run Continuity Check" button
   → Progress modal: "Analyzing 127 events..."
   → AI scans all events, character data, locations, timeline
   → Checks for contradictions and impossibilities
   → Generates report (30 seconds to 2 minutes depending on size)

2. VIEW CONTINUITY REPORT
   Report shows issues by category:

   A) TIMELINE ISSUES ⏰
      ❌ "Event 45: John is in Paris"
          "Event 46 (same day): John is in New York"
          → Impossible travel time
      ❌ "Event 12: Mary is 5 years old"
          "Event 20 (2 years later): Mary is 10 years old"
          → Aging math doesn't add up

   B) KNOWLEDGE INCONSISTENCIES 🧠
      ❌ "Event 30: John learns secret from Mary"
          "Event 25: John mentions the secret"
          → John knows info before he learns it
      ❌ "Event 40: Character dies"
          "Event 50: Character appears"
          → Dead character returns (unintentional)

   C) PHYSICAL IMPOSSIBILITIES 💪
      ❌ "John has brown eyes (profile)"
          "Event 15: '...his blue eyes...'"
          → Eye color changed
      ❌ "Location: Tavern (indoor)"
          "Event text: 'under the night sky'"
          → Indoor/outdoor mismatch

   D) RELATIONSHIP CONTRADICTIONS 💔
      ❌ "Event 10: John meets Mary for first time"
          "Event 5: John and Mary have conversation"
          → They interact before meeting
      ❌ "Event 20: John and Sarah are enemies"
          "Event 25: John trusts Sarah completely"
          → Sudden relationship change without explanation

   E) OBJECT TRACKING 🔍
      ❌ "Event 30: John finds magic sword"
          "Event 40: John needs weapon"
          → Forgot about the sword?

3. RESOLVE ISSUES
   Click issue → Options:
      - "Fix Event": Edit the problematic event
      - "Add Explanation Event": Create event explaining the inconsistency
      - "Mark as Intentional": AI won't flag again (magic, time travel, etc.)
      - "False Positive": This isn't actually an issue

4. LIVE CONTINUITY WARNINGS
   Toggle "Live Continuity Check" ON
   → As you edit events, AI checks in real-time
   → Yellow warning icon appears if continuity issue detected
   → Hover → Tooltip explains issue
   → Can proceed anyway or fix immediately

5. CONTINUITY TRACKING
   Add tracked elements:
   → "Track object: The One Ring"
      - AI monitors mentions of this object
      - Warns if object disappears for long time
      - Flags if two people have it simultaneously
   → "Track knowledge: The secret plan"
      - AI tracks who knows this information
      - Warns if character shouldn't know yet
   → "Track injury: John's broken leg"
      - AI expects recovery time
      - Warns if character too active too soon

6. CONTINUITY EXCEPTIONS
   For fantasy/sci-fi with special rules:
   → Add rules: "Time travel is possible in this world"
   → AI adjusts checking logic
   → Won't flag time paradoxes if time travel is enabled

   → Add magic system rules: "Healing magic exists"
   → Won't flag rapid injury recovery

7. EXPORT CONTINUITY REPORT
   Click "Export" → PDF report for editor/beta readers
   → Organized by issue severity
   → Links to specific events
   → Professional format
```

**Backend Implementation:**
- [planned, N/A] Create ContinuityCheck model:
  - Fields: project_id, run_date, status (running, completed, failed)
  - Fields: issues_found, issues_resolved, issues_ignored
- [planned, N/A] Create ContinuityIssue model:
  - Fields: check_id, issue_type, severity
  - Fields: description, affected_events (JSON array of event IDs)
  - Fields: status (open, resolved, false_positive, intentional)
  - Fields: AI_reasoning (explanation of why it's an issue)
- [planned, N/A] Create TrackedElement model (objects, knowledge, injuries):
  - Fields: name, element_type, tracking_rules (JSON)
  - Fields: first_appearance_event_id, last_seen_event_id
  - Fields: possession_chain (JSON, who has object when)
- [planned, N/A] Create WorldRule model (continuity exceptions):
  - Fields: rule_name, rule_description, affects_checking (JSON)
- [planned, N/A] Implement AI continuity checking service:
  - LLM prompts for each check type
  - Parallel processing for speed
  - Caching for repeated checks
- [planned, N/A] Add API endpoints:
  - POST /continuity-check/run
  - GET /continuity-check/{id}/status
  - GET /continuity-check/{id}/report
  - POST /continuity-issue/{id}/resolve
  - POST /tracked-elements/
  - POST /world-rules/
- [planned, N/A] Write tests for continuity checking

**Frontend Implementation:**
- [N/A, planned] Create ContinuityCheckButton (main toolbar)
- [N/A, planned] Create ContinuityCheckModal (progress + report)
- [N/A, planned] Create ContinuityReportPanel:
  - Categorized issue list
  - Filter by type/severity
  - Click issue → Navigate to event
- [N/A, planned] Create ContinuityIssueCard (displays single issue with actions)
- [N/A, planned] Create TrackedElementsPanel (manage tracked items)
- [N/A, planned] Create WorldRulesPanel (define exceptions)
- [N/A, planned] Add continuity warning icons to EventNodes (live checking)
- [N/A, planned] Create ContinuityWarningTooltip (hover explanation)
- [N/A, planned] Implement PDF export of report
- [N/A, planned] Add Redux slice for continuity checks
- [N/A, planned] Implement WebSocket for real-time check progress

**AI Enhancement:**
- [planned, planned] LLM analyzes all events for contradictions
- [planned, planned] Cross-reference character data, locations, timeline
- [planned, planned] Natural language understanding of event descriptions
- [planned, planned] Learn project-specific rules (world-building)
- [planned, planned] Suggest fixes for issues (not just detect)
- [planned, planned] Confidence scores for each issue (some may be false positives)

---

---

## TEMPORAL SUPPORT SUMMARY ⏰

**Features that REQUIRE temporal data structures:**

### ✅ FULLY SPECIFIED WITH TEMPORAL SUPPORT:
1. **Relationships** - RelationshipHistory model tracks changes over events

### 🔄 NEED TEMPORAL ENHANCEMENTS:
2. **Locations** - LocationHistory: tracks when locations change state (burns down, gets renovated, etc.)
   - Example: "Tavern (Event 1-15: Bustling) → (Event 16: Burned down) → (Event 20-50: Rebuilt as inn)"

3. **Conflicts** - Already has EventConflict junction with intensity_change, but needs:
   - ConflictHistory for tracking state changes beyond events
   - Temporal queries: get_intensity_at_event()

4. **Character Voice** - VoiceProfileHistory: Voice evolves over story
   - Example: Young naive voice → Hardened cynical voice after trauma
   - Link voice changes to specific events

5. **Group Membership** - Membership model needs temporal support:
   - MembershipHistory: when characters join/leave groups
   - Fields: joined_event_id, left_event_id (nullable)

6. **Character State** - CharacterStateHistory:
   - Physical state (injured, healthy, aging)
   - Mental state (confident, broken, wise)
   - Knowledge gained at specific events

### 📊 TEMPORAL QUERY API PATTERN:

All temporal models should support:
```
GET /{resource}/{id}/state/?at_event={event_id}  # State at specific point
GET /{resource}/{id}/history/                      # All changes over time
GET /{resource}/{id}/arc/                          # Graph data
GET /{resource}/{id}/changes-between/?start={e1}&end={e2}  # Changes in range
```

---

## PRIORITY RANKING SUMMARY

### 🥇 **IMMEDIATE PRIORITIES** (Tier 1 - High Value, Quick Wins)
1. **Relationship Visualization** ⏰ - 🔥🔥🔥🔥🔥 (10/10) | 🟠 Hard | Backend exists + Temporal!
2. **Scene Cards/Beat Sheets** - 🔥🔥🔥🔥🔥 (10/10) | 🟡 Medium | Standard outlining
3. **Location Management** ⏰ - 🔥🔥🔥🔥 (9/10) | 🟠 Hard | Backend exists + Temporal needed!
4. **Attachment System** - 🔥🔥🔥🔥 (8/10) | 🟢 Easy | Backend exists!

### 🥈 **NEXT PHASE** (Tier 2 - High Value, More Complex)
5. **Plot Thread Tracking** - 🔥🔥🔥🔥🔥 (10/10) | 🟠 Hard | Essential for complex stories
6. **Character Voice Profiles** ⏰ - 🔥🔥🔥🔥 (8/10) | 🟠 Hard | AI integration + Temporal!
7. **Conflict Tracker** ⏰ - 🔥🔥🔥🔥 (8/10) | 🟠 Hard | Dramatic structure + Temporal!

### 🥉 **LONG-TERM** (Tier 3 - Advanced)
8. **Continuity Checker** ⏰ - 🔥🔥🔥🔥🔥 (10/10) | 🔴 Very Hard | Game-changer, checks temporal consistency!

**Note:** ⏰ = Feature requires temporal data architecture

---

### Future Ideas & Low Priority

- **Collaboration and Sharing**
    - [planned, planned] Implement real-time collaboration using WebSockets
    - [planned, planned] Implement a version history and revert functionality
    - [planned, planned] Add public/private sharing options
    - [planned, planned] Team workspaces with role-based permissions

- **AI-Powered Assistance**
    - [planned, planned] Implement plot hole detection
    - [planned, planned] Implement character motivation analysis
    - [planned, planned] Implement story prompt generation
    - [planned, planned] Implement dialogue enhancement suggestions
    - [planned, planned] Suggest pacing improvements
    - [planned, planned] Theme and symbolism analysis

- **World-Building and Organization**
    - [developed, planned] Add `Location` as a core entity (backend done)
    - [planned, planned] Create timeline view
    - [planned, planned] Implement character arc visualization
    - [developed, planned] Add tools for magic systems and technology (System model exists)
    - [planned, planned] Implement customizable templates
    - [planned, planned] Add a mind mapping tool
    - [developed, planned] Implement image and file uploads (Attachment model exists)
    - [planned, planned] Calendar view for event scheduling
    - [planned, planned] Wiki/encyclopedia mode for world lore

- **Export and Formatting**
    - [planned, planned] Implement customizable formatting
    - [planned, planned] Add advanced export options (Mobi)
    - [planned, planned] Publishing-ready manuscript formatting
    - [planned, planned] Print-ready PDF with custom layouts

- **Performance and UX**
    - [planned, planned] Mobile-first responsive design overhaul
    - [planned, planned] Offline mode with local storage
    - [planned, planned] Keyboard shortcuts and power user features
    - [planned, planned] Dark mode theme
    - [planned, planned] Customizable diagram layout algorithms
    - [planned, planned] Search across all story elements
    - [planned, planned] Undo/redo functionality