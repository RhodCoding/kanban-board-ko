export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'inProgress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    isEditing?: boolean;
}
