'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-custom.css';

type Props = {
  spec: Record<string, unknown>;
};

function ReactSwagger({ spec }: Props) {
  const downloadJson = () => {
    const dataStr = JSON.stringify(spec, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'tickets-api-openapi.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyJsonUrl = () => {
    const url = `${window.location.origin}/api/docs`;
    navigator.clipboard.writeText(url);
    alert('OpenAPI JSON URL copied to clipboard!');
  };

  return (
    <div className="swagger-container">
      <div className="swagger-header">
        <h1>Tickets API Documentation</h1>
        <div className="swagger-actions">
          <button 
            onClick={downloadJson}
            className="swagger-btn swagger-btn-primary"
          >
            📥 Download OpenAPI JSON
          </button>
          <button 
            onClick={copyJsonUrl}
            className="swagger-btn swagger-btn-secondary"
          >
            🔗 Copy JSON URL
          </button>
          <a 
            href="/api/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="swagger-btn swagger-btn-secondary"
          >
            📋 View Raw JSON
          </a>
        </div>
      </div>
      <SwaggerUI 
        spec={spec} 
        docExpansion="list"
        defaultModelsExpandDepth={2}
        tryItOutEnabled={true}
        persistAuthorization={true}
        displayRequestDuration={true}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
      />
    </div>
  );
}

export default ReactSwagger;
