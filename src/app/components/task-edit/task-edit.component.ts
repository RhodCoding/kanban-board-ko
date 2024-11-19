import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="task-edit-form">
      <div class="form-group">
        <label for="title">Title</label>
        <input 
          id="title" 
          type="text" 
          formControlName="title"
          class="form-control"
          [class.is-invalid]="isFieldInvalid('title')"
        >
        <div class="invalid-feedback" *ngIf="isFieldInvalid('title')">
          Title is required
        </div>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea 
          id="description" 
          formControlName="description"
          class="form-control"
          [class.is-invalid]="isFieldInvalid('description')"
        ></textarea>
        <div class="invalid-feedback" *ngIf="isFieldInvalid('description')">
          Description is required
        </div>
      </div>

      <div class="form-group">
        <label for="priority">Priority</label>
        <select 
          id="priority" 
          formControlName="priority"
          class="form-control"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div class="form-group">
        <label for="due_date">Due Date</label>
        <input 
          id="due_date" 
          type="date" 
          formControlName="due_date"
          class="form-control"
        >
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" [disabled]="!taskForm.valid">Save</button>
        <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancel</button>
      </div>
    </form>
  `,
  styles: [`
    .task-edit-form {
      padding: 1rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
    }
    .form-control.is-invalid {
      border-color: #dc3545;
    }
    .invalid-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .form-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
    }
    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .btn-primary {
      background-color: #0d6efd;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: #0b5ed7;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    .btn-secondary:hover {
      background-color: #5c636a;
    }
  `]
})
export class TaskEditComponent implements OnInit {
  @Input() task!: Task;
  @Output() save = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter<void>();

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['medium'],
      due_date: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        priority: this.task.priority,
        due_date: this.task.due_date,
        status: this.task.status
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const updatedTask: Task = {
        ...this.task,
        ...this.taskForm.value
      };
      this.save.emit(updatedTask);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
