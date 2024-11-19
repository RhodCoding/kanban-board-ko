import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskEditComponent } from '../task-edit/task-edit.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskEditComponent],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  editingTask: Task | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks() {
    console.log('Loading tasks...');
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Tasks loaded:', tasks);
        this.todoTasks = tasks.filter(task => task.status === 'todo');
        this.inProgressTasks = tasks.filter(task => task.status === 'inProgress');
        this.doneTasks = tasks.filter(task => task.status === 'done');
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        alert('Failed to load tasks. Please try again.');
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update task status in backend
      const task = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      if (task.id) {
        this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
          next: (response) => {
            if (!response.success) {
              // Revert the move if the update failed
              transferArrayItem(
                event.container.data,
                event.previousContainer.data,
                event.currentIndex,
                event.previousIndex
              );
              alert('Failed to update task status: ' + response.message);
            }
          },
          error: (error) => {
            // Revert the move if there was an error
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );
            alert('Error updating task status: ' + error.message);
          }
        });
      }
    }
  }

  getStatusFromContainerId(containerId: string): string {
    switch (containerId) {
      case 'todo':
        return 'todo';
      case 'inProgress':
        return 'inProgress';
      case 'done':
        return 'done';
      default:
        return 'todo';
    }
  }

  addTask(status: 'todo' | 'inProgress' | 'done') {
    const newTask: Task = {
      title: 'New Task',
      description: 'Click to edit',
      status: status,
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0]
    };

    this.taskService.createTask(newTask).subscribe({
      next: (response) => {
        if (response.success && response.task) {
          // Start editing the new task immediately
          this.editTask(response.task);
        } else {
          alert('Failed to create task: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error creating task:', error);
        alert('Error creating task: ' + error.message);
      }
    });
  }

  editTask(task: Task) {
    this.editingTask = { ...task };
  }

  saveTask(updatedTask: Task) {
    if (!updatedTask.id) {
      console.error('Cannot save task without ID');
      alert('Cannot save task: Missing task ID');
      return;
    }

    this.taskService.updateTask(updatedTask).subscribe({
      next: (response) => {
        if (response.success && response.task) {
          this.editingTask = null;
          this.loadTasks();
        } else {
          alert('Failed to update task: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error updating task:', error);
        alert('Error updating task: ' + error.message);
      }
    });
  }

  cancelEdit() {
    this.editingTask = null;
  }

  deleteTask(taskId: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadTasks();
          } else {
            alert('Failed to delete task: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          alert('Error deleting task: ' + error.message);
        }
      });
    }
  }

  getTasksList(status: string): Task[] {
    switch (status) {
      case 'todo':
        return this.todoTasks;
      case 'inProgress':
        return this.inProgressTasks;
      case 'done':
        return this.doneTasks;
      default:
        return [];
    }
  }

  getTasksCount(status: string): number {
    return this.getTasksList(status).length;
  }

  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }
}
