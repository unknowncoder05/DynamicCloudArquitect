# Plot Thread Tracking System - Complete Implementation Guide

## ✅ Completed Components

### Backend (100% Complete)
1. ✅ PlotThread model with full fields
2. ✅ Event-PlotThread ManyToMany relationship
3. ✅ Serializers with event count
4. ✅ ViewSets with filtering
5. ✅ URLs registered
6. ✅ Django Admin integration

### Frontend Components (100% Complete)
1. ✅ TypeScript interfaces
2. ✅ Redux integration (state, thunks, reducers)
3. ✅ API service methods
4. ✅ CreatePlotThreadModal
5. ✅ EditPlotThreadModal
6. ✅ PlotThreadsSidebar
7. ✅ EventNode with badges and warnings

### DiagramPage Integration (95% Complete)
✅ Imports added
✅ Redux state connected
✅ Layout sizes configured
✅ Modal state added
✅ Collapsed state added

## 🚧 Remaining Tasks

### 1. Add Plot Thread Handlers to DiagramPage

Add these handlers after the existing relationship handlers (search for `handleDeleteRelationship`):

```typescript
// Plot thread handlers
const handleCreatePlotThread = useCallback(async (data: Partial<PlotThread>) => {
  try {
    await dispatch(createPlotThread(data)).unwrap();
    toast.success('Plot thread created successfully!');
  } catch (error) {
    console.error('Failed to create plot thread:', error);
    toast.error('Failed to create plot thread');
  }
}, [dispatch]);

const handleUpdatePlotThread = useCallback(async (id: number, data: Partial<PlotThread>) => {
  try {
    await dispatch(updatePlotThread({ id, data })).unwrap();
    toast.success('Plot thread updated successfully!');
  } catch (error) {
    console.error('Failed to update plot thread:', error);
    toast.error('Failed to update plot thread');
  }
}, [dispatch]);

const handleDeletePlotThread = useCallback(async (id: number) => {
  try {
    await dispatch(deletePlotThread(id)).unwrap();
    toast.success('Plot thread deleted successfully!');
    if (selectedPlotThreadId === id) {
      setSelectedPlotThreadId(null);
    }
  } catch (error) {
    console.error('Failed to delete plot thread:', error);
    toast.error('Failed to delete plot thread');
  }
}, [dispatch, selectedPlotThreadId]);
```

### 2. Add Toggle/Resize Handlers

Add after `handleToggleRelationshipsCollapse`:

```typescript
const handleTogglePlotThreadsCollapse = useCallback(() => {
  if (isPlotThreadsCollapsed) {
    setLayoutSizes(prev => ({
      ...prev,
      plotThreadsSidebarWidth: Math.max(MIN_WIDTH, lastExpandedWidths.plotThreads)
    }));
    setIsPlotThreadsCollapsed(false);
  } else {
    setLastExpandedWidths(prev => ({ ...prev, plotThreads: layoutSizes.plotThreadsSidebarWidth }));
    setLayoutSizes(prev => ({ ...prev, plotThreadsSidebarWidth: COLLAPSED_WIDTH }));
    setIsPlotThreadsCollapsed(true);
  }
}, [isPlotThreadsCollapsed, lastExpandedWidths.plotThreads, layoutSizes.plotThreadsSidebarWidth]);

const handleResizePlotThreadsSidebar = useCallback((delta: number) => {
  if (isPlotThreadsCollapsed) return;

  setLayoutSizes(prev => {
    const currentWidth = prev.plotThreadsSidebarWidth;
    const newWidth = currentWidth + delta;

    if (newWidth < COLLAPSE_THRESHOLD && !isPlotThreadsCollapsed) {
      setLastExpandedWidths(lew => ({ ...lew, plotThreads: currentWidth }));
      setIsPlotThreadsCollapsed(true);
      return { ...prev, plotThreadsSidebarWidth: COLLAPSED_WIDTH };
    }

    const finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    setLastExpandedWidths(lew => ({ ...lew, plotThreads: finalWidth }));
    return { ...prev, plotThreadsSidebarWidth: finalWidth };
  });
}, [isPlotThreadsCollapsed]);
```

### 3. Add PlotThreadsSidebar to Layout

Add after the RelationshipsSidebar (around line 1317):

```typescript
        {/* Plot Threads Sidebar - Resizable */}
        <div className="flex flex-shrink-0 transition-all duration-300" style={{ width: layoutSizes.plotThreadsSidebarWidth }}>
          <PlotThreadsSidebar
            plotThreads={plotThreads}
            selectedThreadId={selectedPlotThreadId}
            onThreadClick={(id) => {
              setSelectedPlotThreadId(selectedPlotThreadId === id ? null : id);
            }}
            onCreateThread={() => setShowCreatePlotThread(true)}
            onEditThread={(id) => {
              const thread = plotThreads.find(pt => pt.id === id);
              if (thread) setEditingPlotThread(thread);
            }}
            isCollapsed={isPlotThreadsCollapsed}
            onToggleCollapse={handleTogglePlotThreadsCollapse}
          />
          <ResizeHandle direction="horizontal" onResize={handleResizePlotThreadsSidebar} disabled={isPlotThreadsCollapsed} />
        </div>
```

### 4. Add Modals at Bottom

Add after the Relationship modals (around line 1580):

```typescript
      {/* Plot Thread Modals */}
      <CreatePlotThreadModal
        isOpen={showCreatePlotThread}
        onClose={() => setShowCreatePlotThread(false)}
        onSave={handleCreatePlotThread}
        projectId={currentProject?.id || 0}
      />
      <EditPlotThreadModal
        isOpen={!!editingPlotThread}
        onClose={() => setEditingPlotThread(null)}
        onSave={handleUpdatePlotThread}
        onDelete={handleDeletePlotThread}
        plotThread={editingPlotThread}
      />
```

### 5. Update Event Modals (CreateEventModal & EditEventModal)

These need to:
1. Accept `plotThreads` as a prop
2. Add multi-select for plot threads (similar to characters/groups)
3. Show warning when no threads selected
4. Include `plot_threads` in the submitted data

This will be implemented in the next step.

## 📝 Usage Instructions

Once complete:

1. **Run Migrations**:
```bash
cd BackEndApi
python src/manage.py makemigrations
python src/manage.py migrate
```

2. **Features Available**:
   - Create/Edit/Delete plot threads
   - Assign events to multiple plot threads
   - Filter diagram by plot thread
   - Color-coded badges on events
   - Warning for unassigned events
   - Priority-based organization

3. **User Flow**:
   - Click "+ New Thread" in sidebar to create thread
   - Click event "Edit" → Assign to threads
   - Click thread in sidebar to filter events
   - Threads show on EventNodes as colored badges

## 🎨 Visual Features

- **Priority Symbols**:
  - ⭐ Main Plot
  - 📖 Subplot
  - 👤 Character Arc
  - 🗺️ Side Quest
  - 🌫️ Background

- **Status Colors**:
  - 🟢 Active (Green)
  - 🔵 Resolved (Blue)
  - ⚫ Abandoned (Gray)

- **Warning System**:
  - Orange warning badge on events without threads
  - Helps ensure complete story tracking
