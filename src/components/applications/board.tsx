"use client";

import {
  useState,
  useTransition,
  useOptimistic,
  useMemo,
  useRef,
  useEffect,
  useId,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { GripVertical, ChevronDown, Check } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/schemas/application";
import { STATUS_COLORS } from "@/components/ui/status-colors";
import { DEADLINE_TONE_CLASS } from "@/components/ui/deadline";
import type { DeadlineTone } from "@/lib/format";
import { isOneOf } from "@/lib/guards";
import { cn } from "@/lib/cn";
import { updateApplicationStatus } from "@/actions/applications";
import { useToast } from "@/components/ui/toast";

export type BoardApplication = {
  id: string;
  role: string;
  company: string;
  status: ApplicationStatus;
  deadline: { label: string; tone: DeadlineTone } | null;
};

const ACTIVE_STATUSES = APPLICATION_STATUSES.filter(
  (s) => s !== "REJECTED",
) as Exclude<ApplicationStatus, "REJECTED">[];

const COLLAPSED_KEY = "board:collapsed";
const NONE: ReadonlySet<string> = new Set();
const collapseListeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = NONE;

// getSnapshot has to return the same object until the stored value actually
// changes; a fresh Set on every call would re-render forever.
function collapsedSnapshot(): ReadonlySet<string> {
  const raw = localStorage.getItem(COLLAPSED_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedSet = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      cachedSet = NONE;
    }
  }
  return cachedSet;
}

function subscribeCollapsed(callback: () => void) {
  collapseListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    collapseListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeCollapsed(next: ReadonlySet<string>) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
  collapseListeners.forEach((listener) => listener());
}

function CardContent({ app }: { app: BoardApplication }) {
  return (
    <>
      <p className="truncate font-sans text-body font-semibold text-ink">
        {app.role}
      </p>
      <p className="mt-0.5 truncate font-sans text-fine text-ink-mute">
        {app.company}
      </p>
      {app.deadline && (
        <p
          className={`mt-1.5 font-mono text-fine tabular-nums ${DEADLINE_TONE_CLASS[app.deadline.tone]}`}
        >
          {app.deadline.label}
        </p>
      )}
    </>
  );
}

// The drag affordance is its own button rather than the card wrapper, so the
// card's <Link> is never nested inside another control. The same button opens
// the move dialog on click: pointer dragging only begins after 8px of travel,
// so a press that does not move still resolves as a click. dnd-kit's
// `attributes` are deliberately not spread — they carry an `aria-describedby`
// pointing at an instructions element this page never renders, and the dialog
// is what tells a keyboard or screen-reader user how to move a card now.
function BoardCard({
  app,
  dragging,
  onMove,
}: {
  app: BoardApplication;
  dragging: boolean;
  onMove: (app: BoardApplication) => void;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, isDragging } =
    useDraggable({ id: app.id });

  return (
    <div ref={setNodeRef} className={`relative ${isDragging ? "opacity-40" : ""}`}>
      <Link
        href={`/dashboard/applications/${app.id}`}
        draggable={false}
        tabIndex={dragging ? -1 : 0}
        className="block rounded-xl border border-hairline bg-canvas py-2.5 pl-3 pr-9 transition-colors hover:border-primary-ink"
      >
        <CardContent app={app} />
      </Link>
      {/* 27px reads right on a card but is under the 44px a thumb needs. The
          pseudo-element extends only the hit area, so the card's layout is
          unchanged. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...listeners}
        onClick={() => onMove(app)}
        aria-haspopup="dialog"
        aria-label={`Move ${app.role} at ${app.company}`}
        className="absolute right-1 top-1 cursor-grab touch-none rounded-md p-1.5 text-ink-mute transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:bg-canvas-lavender hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:cursor-grabbing"
      >
        <GripVertical size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function MoveDialog({
  app,
  onMove,
  onClose,
}: {
  app: BoardApplication | null;
  onMove: (id: string, status: ApplicationStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (app && !dialog.open) dialog.showModal();
    if (!app && dialog.open) dialog.close();
  }, [app]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-xs rounded-2xl border border-hairline bg-canvas p-6 text-ink shadow-panel-lg backdrop:bg-ink/40"
    >
      {app && (
        <>
          <h2 id={titleId} className="font-sans text-body-lg font-bold text-ink">
            Move this application
          </h2>
          <p className="mt-1 font-sans text-caption text-ink-mute">
            {app.role} at {app.company}
          </p>
          <ul className="mt-4 flex flex-col gap-1">
            {APPLICATION_STATUSES.map((status) => {
              const current = status === app.status;
              return (
                <li key={status}>
                  <button
                    type="button"
                    onClick={() => onMove(app.id, status)}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-left font-sans text-body transition-colors hover:bg-canvas-lavender",
                      current && "font-semibold",
                    )}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${STATUS_COLORS[status].dot}`}
                      aria-hidden="true"
                    />
                    {STATUS_LABELS[status]}
                    {current && (
                      <Check
                        size={15}
                        aria-hidden="true"
                        className="ml-auto text-ink-mute"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </dialog>
  );
}

function SectionHeader({
  status,
  count,
  collapsed,
  onToggle,
  trailing,
}: {
  status: ApplicationStatus;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="flex w-full items-center gap-2 px-0.5 text-left"
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${STATUS_COLORS[status].dot}`}
        aria-hidden="true"
      />
      <h2 className="font-sans text-fine font-semibold uppercase tracking-wide text-ink-mute">
        {STATUS_LABELS[status]}
      </h2>
      <span className="font-mono text-fine tabular-nums text-ink-mute">
        {count}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {trailing}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            "text-ink-mute transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </span>
    </button>
  );
}

function BoardColumn({
  status,
  apps,
  dragging,
  collapsed,
  onToggle,
  onMove,
}: {
  status: ApplicationStatus;
  apps: BoardApplication[];
  dragging: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onMove: (app: BoardApplication) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const show = dragging || !collapsed;

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 lg:w-60">
      <SectionHeader
        status={status}
        count={apps.length}
        collapsed={collapsed}
        onToggle={onToggle}
      />
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-16 flex-1 flex-col gap-2 rounded-xl p-1.5 transition-colors lg:min-h-30",
          isOver && "bg-canvas-lavender-hover",
          !show && "hidden",
        )}
      >
        {apps.map((app) => (
          <BoardCard
            key={app.id}
            app={app}
            dragging={dragging}
            onMove={onMove}
          />
        ))}
        {apps.length === 0 && (
          <p className="m-auto px-3 py-6 text-center font-sans text-fine text-ink-mute">
            {dragging ? "Drop here" : "Empty"}
          </p>
        )}
      </div>
    </div>
  );
}

function RejectedStrip({
  apps,
  dragging,
  collapsed,
  onToggle,
  onMove,
}: {
  apps: BoardApplication[];
  dragging: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onMove: (app: BoardApplication) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "REJECTED" });
  const show = dragging || !collapsed;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-hairline px-3 py-2.5 transition-colors",
        isOver ? "bg-canvas-lavender-hover" : "bg-canvas-lavender",
      )}
    >
      <SectionHeader
        status="REJECTED"
        count={apps.length}
        collapsed={collapsed}
        onToggle={onToggle}
        trailing={
          dragging ? (
            <span className="font-sans text-fine text-ink-mute">
              Drop to reject
            </span>
          ) : null
        }
      />
      {apps.length > 0 && (
        <div
          className={cn(
            "mt-2 flex flex-col gap-2 lg:flex-row lg:overflow-x-auto lg:pb-1",
            !show && "hidden",
          )}
        >
          {apps.map((app) => (
            <div key={app.id} className="relative w-full shrink-0 lg:w-40">
              <Link
                href={`/dashboard/applications/${app.id}`}
                className="block rounded-lg border border-hairline bg-canvas py-1.5 pl-3 pr-9 transition-colors hover:border-primary-ink"
              >
                <p className="truncate font-sans text-fine font-medium text-ink">
                  {app.role}
                </p>
                <p className="truncate font-sans text-fine text-ink-mute">
                  {app.company}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => onMove(app)}
                aria-haspopup="dialog"
                aria-label={`Move ${app.role} at ${app.company}`}
                className="absolute right-1 top-1 rounded-md p-1.5 text-ink-mute transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:bg-canvas-lavender hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <GripVertical size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApplicationsBoard({
  applications,
}: {
  applications: BoardApplication[];
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moving, setMoving] = useState<BoardApplication | null>(null);
  // Which columns are folded away is a preference, not a fact about the data —
  // it survives opening a card and coming back. Nothing is collapsed on the
  // server, so the first paint matches and the stored set applies on hydration.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    collapsedSnapshot,
    () => NONE,
  );
  const [optimisticApps, moveOptimistic] = useOptimistic(
    applications,
    (state, move: { id: string; status: ApplicationStatus }) =>
      state.map((app) =>
        app.id === move.id ? { ...app, status: move.status } : app,
      ),
  );

  // No KeyboardSensor: dnd-kit moves a picked-up card 25px per arrow press, so
  // reaching the next column cost five presses side by side and roughly
  // seventy stacked on a phone. The move dialog does the same job in two.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function toggle(id: string) {
    const next = new Set(collapsed);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    writeCollapsed(next);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const target = event.over?.id;
    if (!isOneOf(APPLICATION_STATUSES, target)) return;
    moveTo(String(event.active.id), target);
  }

  function moveTo(id: string, target: ApplicationStatus) {
    setMoving(null);
    const app = optimisticApps.find((a) => a.id === id);
    if (!app || app.status === target) return;

    startTransition(async () => {
      moveOptimistic({ id, status: target });
      try {
        const result = await updateApplicationStatus(id, target);
        if (result.error) {
          toast(result.error, "error");
        } else {
          toast(`Moved to ${STATUS_LABELS[target]}.`);
        }
      } catch {
        // An error thrown inside an async transition reaches the nearest error
        // boundary. A dropped connection shouldn't replace the whole board —
        // the optimistic move reverts on its own once the transition settles.
        toast("Couldn't move the card. Check your connection.", "error");
      }
    });
  }

  const activeApp = activeId
    ? optimisticApps.find((a) => a.id === activeId)
    : null;
  const dragging = activeId !== null;

  const announcements = useMemo<Announcements>(() => {
    const card = (id: string | number) => {
      const app = optimisticApps.find((a) => a.id === String(id));
      return app ? `${app.role} at ${app.company}` : "this application";
    };
    const column = (id: string | number | undefined) =>
      isOneOf(APPLICATION_STATUSES, id) ? STATUS_LABELS[id] : null;

    return {
      onDragStart: ({ active }) =>
        `Picked up ${card(active.id)}. Use the arrow keys to pick a column, then press space to drop.`,
      onDragOver: ({ active, over }) => {
        const target = column(over?.id);
        return target
          ? `${card(active.id)} is over ${target}.`
          : `${card(active.id)} is not over a column.`;
      },
      onDragEnd: ({ active, over }) => {
        const target = column(over?.id);
        return target
          ? `Moved ${card(active.id)} to ${target}.`
          : `Dropped ${card(active.id)}. It stayed where it was.`;
      },
      onDragCancel: ({ active }) =>
        `Cancelled moving ${card(active.id)}. It stayed where it was.`,
    };
  }, [optimisticApps]);

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:overflow-x-auto lg:pb-1">
          {ACTIVE_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              apps={optimisticApps.filter((app) => app.status === status)}
              dragging={dragging}
              collapsed={collapsed.has(status)}
              onToggle={() => toggle(status)}
              onMove={setMoving}
            />
          ))}
        </div>
        <RejectedStrip
          apps={optimisticApps.filter((app) => app.status === "REJECTED")}
          dragging={dragging}
          collapsed={collapsed.has("REJECTED")}
          onToggle={() => toggle("REJECTED")}
          onMove={setMoving}
        />
      </div>
      <DragOverlay>
        {activeApp && (
          <div className="w-60 rounded-xl border border-primary-ink bg-canvas py-2.5 pl-3 pr-9 shadow-[0_10px_30px_rgba(74,21,75,0.2)]">
            <CardContent app={activeApp} />
          </div>
        )}
      </DragOverlay>
      <MoveDialog
        app={moving}
        onMove={moveTo}
        onClose={() => setMoving(null)}
      />
    </DndContext>
  );
}
