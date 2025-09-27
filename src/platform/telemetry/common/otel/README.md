# Experimental OpenTelemetry Mirroring

This fork adds an optional OpenTelemetry (OTel) exporter that mirrors existing Copilot Chat telemetry events.
It does **not** add raw prompt/model text. Only the same structured properties & measurements the extension already emits are forwarded.

## Enable

Add to user or workspace settings:

```json
{
  "copilotChat.experimentalOtel.enabled": true,
  "copilotChat.experimentalOtel.endpoint": "https://otel-collector.example.com/v1/traces",
  "copilotChat.experimentalOtel.serviceName": "copilot-chat",
  "copilotChat.experimentalOtel.headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  }
}
```

## Data Shape

Each original event → one span:
- `prop.*` attributes mirror event properties.
- `measure.*` attributes mirror numeric measurements.
- Error events set `error=true` and record an exception marker.

## Opt-Out

Disable by setting `"copilotChat.experimentalOtel.enabled": false` (default).