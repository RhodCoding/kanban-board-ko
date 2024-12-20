import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Task } from '../models/task.model';

interface ApiResponse {
  success: boolean;
  message: string;
  task?: Task;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost/kanban-board-ko/backend/api.php';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (typeof error.error === 'string') {
      try {
        const parsedError = JSON.parse(error.error);
        errorMessage = parsedError.message || 'Unknown error occurred';
      } catch {
        errorMessage = error.error;
      }
    } else if (error.error && error.error.message) {
      // Server-side error with message
      errorMessage = error.error.message;
    } else {
      // Other server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl, this.httpOptions).pipe(
      tap(response => console.log('Received tasks:', response)),
      catchError(this.handleError)
    );
  }

  createTask(task: Task): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, task, this.httpOptions).pipe(
      tap(response => console.log('Create task response:', response)),
      catchError(this.handleError)
    );
  }

updateTask(task: Task): Observable<ApiResponse> {
    console.log('Updating task:', task);
    if (!task.id) {
        return throwError(() => new Error('Task ID is required'));
    }
    const url = `${this.apiUrl}?id=${task.id}`;
    return this.http.put<ApiResponse>(url, task, this.httpOptions).pipe(
        map(response => {
            console.log('Update task response:', response);
            if (response && typeof response === 'object' && 'success' in response) {
                if (response.success) {
                    return response;
                } else {
                    throw new Error(response.message || 'Failed to update task');
                }
            }
            throw new Error('Invalid response format');
        }),
        catchError(this.handleError)
    );
}

  updateTaskStatus(taskId: number, status: string): Observable<ApiResponse> {
    if (!taskId) {
      return throwError(() => new Error('Task ID is required'));
    }
    const url = `${this.apiUrl}?id=${taskId}`;
    return this.http.put<ApiResponse>(url, { status }, this.httpOptions).pipe(
      tap(response => console.log('Update status response:', response)),
      catchError(this.handleError)
    );
  }

  deleteTask(taskId: number): Observable<ApiResponse> {
    if (!taskId) {
      return throwError(() => new Error('Task ID is required'));
    }
    const url = `${this.apiUrl}?id=${taskId}`;
    return this.http.delete<ApiResponse>(url, this.httpOptions).pipe(
      tap(response => console.log('Delete task response:', response)),
      catchError(this.handleError)
    );
  }
}
