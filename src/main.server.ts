import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

// The BootstrapContext argument is required. Without it, route extraction fails
// during the build with a bare "NG0401 — An error occurred while extracting routes"
// and no stack trace.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
