"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createTaskRepository } from "@/infrastructure/supabase/repositories/task.repository";
import {
  updateTaskStatusAction,
  deleteTaskAction,
  reopenTaskAction,
} from "@/actions/task.actions";
import { useRealtime } from "./use-realtime";
import { STATUS_ORDER } from "@/domain/tasks/constants";
import type { Task, TaskStatus } from "@/domain/tasks/types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const repo = createTaskRepository(supabase);
    try {
      const data = await repo.findAll();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useRealtime("tasks", fetchTasks);

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const result = await updateTaskStatusAction(taskId, newStatus, task.status);
    if (result.error) {
      // Rollback
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }

  async function moveTask(taskId: string, direction: 1 | -1) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= STATUS_ORDER.length) return;
    await updateStatus(taskId, STATUS_ORDER[nextIndex]);
  }

  async function deleteTask(taskId: string) {
    const snapshot = tasks.find((t) => t.id === taskId);
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteTaskAction(taskId);
    if (result.error && snapshot) {
      // Rollback
      setTasks((prev) => [snapshot, ...prev]);
    }
  }

  async function reopenTask(taskId: string, note: string) {
    await reopenTaskAction(taskId, note);
    // Realtime will trigger fetchTasks; optimistic for speed:
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: "en_progreso" as TaskStatus } : t)
    );
  }

  return { tasks, loading, fetchTasks, updateStatus, moveTask, deleteTask, reopenTask };
}
