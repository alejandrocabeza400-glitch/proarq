import type { NextFunction, Request, Response } from 'express';
import type { SwaggerUiOptions } from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config';

// ---------------------------------------------------------------------------
// Swagger UI Setup
// ---------------------------------------------------------------------------

export const swaggerUiOptions: SwaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ProArq API Documentation',
};

const UI_BASE_PATH = '';

const specJson = JSON.stringify(swaggerSpec);

function generateSwaggerHTML(): string {
  return `<!-- HTML for static distribution bundle build -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ProArq API Documentation</title>
  <link rel="stylesheet" type="text/css" href="${UI_BASE_PATH}swagger-ui.css" >
  <link rel="icon" type="image/png" href="${UI_BASE_PATH}favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="${UI_BASE_PATH}favicon-16x16.png" sizes="16x16" />
  <style>
    html{box-sizing:border-box;overflow:-moz-scrollbars-vertical;overflow-y:scroll}
    *,*:before,*:after{box-sizing:inherit}
    body{margin:0;background:#fafafa}
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="${UI_BASE_PATH}swagger-ui-bundle.js"> </script>
<script src="${UI_BASE_PATH}swagger-ui-standalone-preset.js"> </script>
<script>
window.onload = function() {
  var spec = ${specJson};
  var ui = SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout"
  });
  window.ui = ui;
};
</script>
<style>
  .swagger-ui .topbar { display: none }
</style>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const swaggerFiles = swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions);

export const swaggerServe = [swaggerFiles[0], swaggerFiles[1]];

export function swaggerSetupHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.send(generateSwaggerHTML());
}

// Re-export for convenience
export { swaggerSpec };
