'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, Save, X, FileText } from 'lucide-react'
import { saveSnippet, deleteSnippet, type Snippet } from '../actions/update-voice-settings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SnippetsManagerProps {
  initialSnippets: Snippet[]
}

export function SnippetsManager({ initialSnippets }: SnippetsManagerProps) {
  const router = useRouter()
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets || [])
  const [isAdding, setIsAdding] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newSnippet, setNewSnippet] = useState({ name: '', content: '' })
  const [editSnippet, setEditSnippet] = useState({ name: '', content: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handleAddSnippet = async () => {
    if (!newSnippet.name.trim() || !newSnippet.content.trim()) {
      toast.error('Please fill in both name and content')
      return
    }

    setIsSaving(true)
    try {
      const result = await saveSnippet(newSnippet)

      if (result.success) {
        toast.success('Snippet saved successfully')
        setSnippets([...snippets, newSnippet])
        setNewSnippet({ name: '', content: '' })
        setIsAdding(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save snippet')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error saving snippet:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSnippet = async () => {
    if (!editSnippet.name.trim() || !editSnippet.content.trim()) {
      toast.error('Please fill in both name and content')
      return
    }

    setIsSaving(true)
    try {
      const result = await saveSnippet(editSnippet)

      if (result.success) {
        toast.success('Snippet updated successfully')
        setSnippets(
          snippets.map(s => (s.name === editingName ? editSnippet : s))
        )
        setEditingName(null)
        setEditSnippet({ name: '', content: '' })
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update snippet')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error updating snippet:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSnippet = async (name: string) => {
    if (!confirm(`Are you sure you want to delete the snippet "${name}"?`)) {
      return
    }

    try {
      const result = await deleteSnippet(name)

      if (result.success) {
        toast.success('Snippet deleted successfully')
        setSnippets(snippets.filter(s => s.name !== name))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete snippet')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error deleting snippet:', error)
    }
  }

  const startEditing = (snippet: Snippet) => {
    setEditingName(snippet.name)
    setEditSnippet(snippet)
    setIsAdding(false)
  }

  const cancelEditing = () => {
    setEditingName(null)
    setEditSnippet({ name: '', content: '' })
  }

  const cancelAdding = () => {
    setIsAdding(false)
    setNewSnippet({ name: '', content: '' })
  }

  return (
    <Card className="shadow-card border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle className="text-lg">Content Snippets</CardTitle>
              <CardDescription className="mt-1">
                Reusable text blocks the AI can reference when generating emails
              </CardDescription>
            </div>
          </div>
          {!isAdding && !editingName && (
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Snippet
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Snippet Form */}
        {isAdding && (
          <div className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50/50">
            <div className="space-y-2">
              <Label htmlFor="new-snippet-name">Name</Label>
              <Input
                id="new-snippet-name"
                placeholder="e.g., Mission Statement"
                value={newSnippet.name}
                onChange={(e) =>
                  setNewSnippet({ ...newSnippet, name: e.target.value })
                }
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-snippet-content">
                Content
                <span className="text-xs text-neutral-500 ml-2">
                  ({newSnippet.content.length}/500)
                </span>
              </Label>
              <Textarea
                id="new-snippet-content"
                placeholder="Enter the snippet content..."
                value={newSnippet.content}
                onChange={(e) =>
                  setNewSnippet({ ...newSnippet, content: e.target.value })
                }
                maxLength={500}
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddSnippet}
                disabled={isSaving}
                size="sm"
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Snippet
                  </>
                )}
              </Button>
              <Button
                onClick={cancelAdding}
                disabled={isSaving}
                variant="outline"
                size="sm"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Snippets List */}
        {snippets.length > 0 ? (
          <div className="space-y-3">
            {snippets.map((snippet) => (
              <div
                key={snippet.name}
                className="border border-neutral-200 rounded-lg p-4 bg-white"
              >
                {editingName === snippet.name ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-snippet-name">Name</Label>
                      <Input
                        id="edit-snippet-name"
                        value={editSnippet.name}
                        onChange={(e) =>
                          setEditSnippet({ ...editSnippet, name: e.target.value })
                        }
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-snippet-content">
                        Content
                        <span className="text-xs text-neutral-500 ml-2">
                          ({editSnippet.content.length}/500)
                        </span>
                      </Label>
                      <Textarea
                        id="edit-snippet-content"
                        value={editSnippet.content}
                        onChange={(e) =>
                          setEditSnippet({
                            ...editSnippet,
                            content: e.target.value,
                          })
                        }
                        maxLength={500}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleEditSnippet}
                        disabled={isSaving}
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Badge variant="secondary" className="font-medium">
                        {snippet.name}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => startEditing(snippet)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteSnippet(snippet.name)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                      {snippet.content}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : !isAdding ? (
          <div className="text-center py-8 border border-dashed border-neutral-200 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600 mb-1">
              No snippets yet
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              Add reusable content blocks for AI to reference
            </p>
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Your First Snippet
            </Button>
          </div>
        ) : null}

        <div className="text-xs text-neutral-500 pt-2 border-t">
          <p className="mb-1 font-medium text-neutral-700">Examples:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Mission Statement: Your organization&apos;s core purpose</li>
            <li>Impact Paragraph: Recent accomplishments to share</li>
            <li>Signature Block: Closing text for emails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
