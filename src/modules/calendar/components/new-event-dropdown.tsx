'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, UserPlus, CheckSquare, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NewTaskDialog } from './new-task-dialog'

export function NewEventDropdown() {
  const [open, setOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  const handleNewTask = () => {
    setOpen(false)
    setTaskDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Event
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link
              href="/volunteers/shifts/new"
              className="flex items-center cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <UserPlus className="h-4 w-4 mr-2 text-violet-600" />
              <span>New Shift</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center cursor-pointer"
            onClick={handleNewTask}
          >
            <CheckSquare className="h-4 w-4 mr-2 text-teal-600" />
            <span>New Task</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
      />
    </>
  )
}
