'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SponsorshipCard, SponsorshipCardOverlay } from './sponsorship-card';
import { updateSponsorshipStatus } from '../actions/update-sponsorship';
import type { SponsorshipWithContact } from '../queries/get-sponsorships';
import type { SponsorshipStatus } from '../schemas/sponsorship.schema';
import type { SponsorshipPipelineColumn } from '../queries/get-sponsor-pipeline';

interface SponsorPipelineProps {
  columns: SponsorshipPipelineColumn[];
}

const STATUS_CONFIG: Record<SponsorshipStatus, {
  label: string;
  dotColor: string;
  borderColor: string;
}> = {
  prospect: {
    label: 'Prospect',
    dotColor: 'bg-blue-500',
    borderColor: 'border-l-blue-500',
  },
  pitched: {
    label: 'Pitched',
    dotColor: 'bg-violet-500',
    borderColor: 'border-l-violet-500',
  },
  confirmed: {
    label: 'Confirmed',
    dotColor: 'bg-amber-500',
    borderColor: 'border-l-amber-500',
  },
  active: {
    label: 'Active',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-l-emerald-500',
  },
  lapsed: {
    label: 'Lapsed',
    dotColor: 'bg-orange-500',
    borderColor: 'border-l-orange-500',
  },
  declined: {
    label: 'Declined',
    dotColor: 'bg-red-500',
    borderColor: 'border-l-red-500',
  },
};

const STATUSES: SponsorshipStatus[] = [
  'prospect', 'pitched', 'confirmed', 'active', 'lapsed', 'declined',
];

/**
 * Kanban board with 6 columns for sponsorship status.
 * Follows the same pattern as the pipeline PipelineKanban component.
 */
export function SponsorPipeline({ columns: initialColumns }: SponsorPipelineProps) {
  const router = useRouter();

  // Build a mutable map of sponsorships by status
  const buildSponsorshipsByStatus = (cols: SponsorshipPipelineColumn[]) => {
    const map: Record<SponsorshipStatus, SponsorshipWithContact[]> = {
      prospect: [],
      pitched: [],
      confirmed: [],
      active: [],
      lapsed: [],
      declined: [],
    };
    for (const col of cols) {
      map[col.status] = col.sponsorships;
    }
    return map;
  };

  const [sponsorshipsByStatus, setSponsorshipsByStatus] = useState(
    buildSponsorshipsByStatus(initialColumns),
  );
  const [activeSponsorship, setActiveSponsorship] = useState<SponsorshipWithContact | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<SponsorshipStatus, boolean>>({
    prospect: false,
    pitched: false,
    confirmed: false,
    active: false,
    lapsed: false,
    declined: false,
  });

  const toggleColumnCollapse = (status: SponsorshipStatus) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const sponsorshipId = event.active.id as string;
    for (const status of STATUSES) {
      const found = sponsorshipsByStatus[status].find((s) => s.id === sponsorshipId);
      if (found) {
        setActiveSponsorship(found);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSponsorship(null);

    if (!over) return;

    const sponsorshipId = active.id as string;
    const newStatus = over.id as SponsorshipStatus;

    // Find current status
    let currentStatus: SponsorshipStatus | null = null;
    for (const status of STATUSES) {
      if (sponsorshipsByStatus[status].find((s) => s.id === sponsorshipId)) {
        currentStatus = status;
        break;
      }
    }

    if (!currentStatus || currentStatus === newStatus) return;

    // Optimistic update
    const sponsorship = sponsorshipsByStatus[currentStatus].find((s) => s.id === sponsorshipId);
    if (!sponsorship) return;

    const newMap = { ...sponsorshipsByStatus };
    newMap[currentStatus] = sponsorshipsByStatus[currentStatus].filter((s) => s.id !== sponsorshipId);
    newMap[newStatus] = [...sponsorshipsByStatus[newStatus], { ...sponsorship, status: newStatus }];
    setSponsorshipsByStatus(newMap);

    // Server update
    setIsUpdating(true);
    try {
      const result = await updateSponsorshipStatus({
        sponsorship_id: sponsorshipId,
        new_status: newStatus,
      });

      if (result.success) {
        router.refresh();
      } else {
        // Revert
        setSponsorshipsByStatus(buildSponsorshipsByStatus(initialColumns));
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      setSponsorshipsByStatus(buildSponsorshipsByStatus(initialColumns));
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-6 gap-3">
        {STATUSES.map((status) => {
          const sponsorships = sponsorshipsByStatus[status] || [];
          const config = STATUS_CONFIG[status];
          const isCollapsed = collapsedColumns[status];

          return (
            <SortableContext
              key={status}
              items={sponsorships.map((s) => s.id)}
              id={status}
            >
              <div
                className={cn(
                  'flex flex-col rounded-lg bg-neutral-50/80 border border-neutral-200/60',
                  isCollapsed ? 'w-12' : 'min-w-[240px]',
                )}
              >
                {/* Column Header */}
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 bg-neutral-100/80 rounded-t-lg border-b border-neutral-200/60',
                    isCollapsed && 'flex-col py-4 gap-2',
                  )}
                >
                  <button
                    onClick={() => toggleColumnCollapse(status)}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    )}
                    <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                    {!isCollapsed && (
                      <h3 className="text-sm font-medium text-neutral-700">
                        {config.label}
                      </h3>
                    )}
                  </button>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                    {sponsorships.length}
                  </span>
                </div>

                {/* Column Content */}
                {!isCollapsed && (
                  <>
                    <div className="flex-1 p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto">
                      {sponsorships.length > 0 ? (
                        sponsorships.map((sponsorship) => (
                          <SponsorshipCard
                            key={sponsorship.id}
                            sponsorship={sponsorship}
                            stageBorderColor={config.borderColor}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-white/50 p-6 text-center">
                          <p className="text-xs text-neutral-400">
                            No sponsors in this stage
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Drag cards here or add new
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add Button */}
                    <div className="p-2 border-t border-neutral-200/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 h-8"
                        asChild
                      >
                        <Link href="/contacts">
                          <Plus className="h-4 w-4 mr-2" />
                          Add sponsor
                        </Link>
                      </Button>
                    </div>
                  </>
                )}

                {/* Collapsed state */}
                {isCollapsed && (
                  <div className="flex-1 flex items-start justify-center pt-4">
                    <span
                      className="text-xs font-medium text-neutral-500"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                      {config.label}
                    </span>
                  </div>
                )}
              </div>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeSponsorship ? (
          <SponsorshipCardOverlay
            sponsorship={activeSponsorship}
            stageBorderColor={STATUS_CONFIG[activeSponsorship.status]?.borderColor}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
