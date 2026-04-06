from __future__ import annotations

from typing import Any

from ..base import (
    PluginContext,
    PluginField,
    PluginManifest,
    PluginRefreshResult,
    ScreenPlugin,
)

NUM_EVENTS = 4


class HomeAssistantAgendaPlugin(ScreenPlugin):
    manifest = PluginManifest(
        plugin_id='ha_agenda',
        name='Home Assistant Agenda',
        description='Display calendar agenda from Home Assistant input_text helpers.',
        default_refresh_interval_seconds=300,
        settings_schema=(
            PluginField(
                name='haUrl',
                label='Home Assistant URL',
                field_type='text',
                default='',
                required=True,
                placeholder='http://192.168.1.x:8123',
                help_text='Base URL of your Home Assistant instance.',
            ),
            PluginField(
                name='haToken',
                label='Long-Lived Access Token',
                field_type='text',
                default='',
                required=True,
                help_text='Create one in HA under your profile page.',
            ),
            PluginField(
                name='entityPrefix',
                label='Entity Prefix',
                field_type='text',
                default='input_text.agenda_line_',
                required=True,
                help_text='Prefix for numbered entities (1-4 appended).',
            ),
        ),
        design_schema=(
            PluginField(
                name='title',
                label='Title Override',
                field_type='text',
                default='',
            ),
        ),
    )

    async def refresh(
        self,
        *,
        settings: dict[str, Any],
        design: dict[str, Any],
        context: PluginContext,
        http_session,
        previous_state: dict[str, Any] | None = None,
        common_settings: dict[str, Any] | None = None,
    ) -> PluginRefreshResult:
        ha_url = str(settings.get('haUrl') or '').strip().rstrip('/')
        ha_token = str(settings.get('haToken') or '').strip()
        entity_prefix = str(settings.get('entityPrefix') or 'input_text.agenda_line_').strip()

        if not ha_url:
            raise ValueError('Home Assistant URL is not configured.')
        if not ha_token:
            raise ValueError('Long-Lived Access Token is not configured.')

        headers = {
            'Authorization': f'Bearer {ha_token}',
            'Content-Type': 'application/json',
        }

        lines: list[str] = []
        for i in range(1, NUM_EVENTS + 1):
            entity_id = f'{entity_prefix}{i}'
            url = f'{ha_url}/api/states/{entity_id}'

            async with http_session.get(url, headers=headers) as response:
                if not response.ok:
                    lines.append('')
                    lines.append('')
                    continue
                data = await response.json(content_type=None)
                state = str(data.get('state') or '').strip().upper()

            # Split on | — expected format: "04/06 | 10:00 AM | EVENT NAME"
            parts = [p.strip() for p in state.split('|')]

            if len(parts) >= 3:
                # Row 1: date + time (e.g. "04/06  10:00 AM")
                date_time = f'{parts[0]}  {parts[1]}'
                # Row 2: event name
                event_name = parts[2]
            elif len(parts) == 2:
                date_time = parts[0]
                event_name = parts[1]
            else:
                date_time = state
                event_name = ''

            lines.append(date_time[:context.cols].ljust(context.cols))
            lines.append(event_name[:context.cols].ljust(context.cols))

        return PluginRefreshResult(
            lines=lines[:context.rows],
            meta={},
        )

    def placeholder_lines(
        self,
        *,
        settings: dict[str, Any],
        design: dict[str, Any],
        context: PluginContext,
        error: str | None = None,
    ) -> list[str]:
        if error:
            return [error[:context.cols]]
        return ['LOADING AGENDA...'[:context.cols]]


PLUGIN = HomeAssistantAgendaPlugin()
