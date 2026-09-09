/**
 * Tasks Module
 *
 * This module provides contact notes and task management functionality including:
 * - Enhanced note creation with categories, tags, and importance
 * - Note pinning, filtering, and search
 * - Task creation and tracking
 * - Task completion
 * - Dashboard task widgets
 */

// Actions
export { createNote } from './actions/create-note'
export { updateNote } from './actions/update-note'
export { togglePinNote } from './actions/toggle-pin-note'
export { deleteNote } from './actions/delete-note'
export { createTask } from './actions/create-task'
export { completeTask } from './actions/complete-task'

// Queries
export { getNotes, getNoteTags } from './queries/get-notes'
export { getTasks } from './queries/get-tasks'

// Components
export { NotesList } from './components/notes-list'
export { TasksList } from './components/tasks-list'
export { AddNoteForm } from './components/add-note-form'
export { AddTaskForm } from './components/add-task-form'
export { MyTasksWidget } from './components/my-tasks-widget'
export { NoteCard } from './components/note-card'
export { NoteTypeBadge, NoteImportanceBadge } from './components/note-type-badge'
export { NotesFilterBar } from './components/notes-filter-bar'

// Types
export type {
  ContactNote,
  ContactTask,
  CreateNoteInput,
  UpdateNoteInput,
  CreateTaskInput,
  CompleteTaskInput,
  NoteType,
  NoteImportance,
} from './schemas/task.schema'
export { NOTE_TYPE_CONFIG, NOTE_IMPORTANCE_CONFIG } from './schemas/task.schema'
export type { TaskWithContact, GetTasksOptions } from './queries/get-tasks'
export type { GetNotesOptions, GetNotesResult } from './queries/get-notes'
export type { CreateNoteResult } from './actions/create-note'
export type { UpdateNoteResult } from './actions/update-note'
export type { TogglePinNoteResult } from './actions/toggle-pin-note'
export type { DeleteNoteResult } from './actions/delete-note'
export type { CreateTaskResult } from './actions/create-task'
export type { CompleteTaskResult } from './actions/complete-task'
