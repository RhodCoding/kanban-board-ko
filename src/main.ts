import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, bootstrap } from './app/app.config';

bootstrapApplication(bootstrap, appConfig)
  .catch((err) => console.error(err));
