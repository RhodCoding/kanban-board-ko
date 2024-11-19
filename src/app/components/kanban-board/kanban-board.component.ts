import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.interface';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  priorities = ['low', 'medium', 'high'];

  constructor() {}

  ngOnInit(): void {
    // Load tasks from localStorage if available
    const savedTasks = localStorage.getItem('kanbanTasks');
    if (savedTasks) {
      const { todo, inProgress, done } = JSON.parse(savedTasks);
      this.todoTasks = todo;
      this.inProgressTasks = inProgress;
      this.doneTasks = done;
    } else {
      // Initialize with a sample task
      this.todoTasks = [
        {
          id: '1',
          title: 'Sample Task',
          description: 'This is a sample task',
          status: 'todo',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update the status of the moved task
      const movedTask = event.container.data[event.currentIndex];
      if (event.container.id === 'todo') {
        movedTask.status = 'todo';
      } else if (event.container.id === 'inProgress') {
        movedTask.status = 'inProgress';
      } else if (event.container.id === 'done') {
        movedTask.status = 'done';
      }
      movedTask.updatedAt = new Date();
    }
    this.saveTasks();
  }

  addTask(status: 'todo' | 'inProgress' | 'done') {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: 'Click to edit',
      status: status,
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      isEditing: true
    };

    if (status === 'todo') {
      this.todoTasks.push(newTask);
    } else if (status === 'inProgress') {
      this.inProgressTasks.push(newTask);
    } else {
      this.doneTasks.push(newTask);
    }
    this.saveTasks();
  }

  deleteTask(task: Task) {
    const tasks = this.getTasksList(task.status);
    const index = tasks.indexOf(task);
    if (index !== -1) {
      tasks.splice(index, 1);
      this.saveTasks();
    }
  }

  editTask(task: Task) {
    task.isEditing = true;
  }

  saveTask(task: Task) {
    task.isEditing = false;
    task.updatedAt = new Date();
    this.saveTasks();
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

  getPriorityClass(priority: string): string {
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

  private saveTasks() {
    const tasks = {
      todo: this.todoTasks,
      inProgress: this.inProgressTasks,
      done: this.doneTasks
    };
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
  }
}
