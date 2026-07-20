window.DISCOVERYAI_OUTREACH_ENDPOINT = '';

window.DISCOVERYAI_IDEAS_ENDPOINT = location.protocol === 'file:'
  ? 'http://localhost:8002/api/research-plan'
  : '/api/research-plan';

window.DISCOVERYAI_SOURCES_ENDPOINT = '';
