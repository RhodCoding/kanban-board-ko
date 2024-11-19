import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes)
  ]
};

export const bootstrap = KanbanBoardComponent;
