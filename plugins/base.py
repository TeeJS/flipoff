from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from aiohttp import ClientSession


@dataclass(frozen=True)
class PluginFieldOption:
    label: str
    value: str

    def serialize(self) -> dict[str, str]:
        return {
            'label': self.label,
            'value': self.value,
        }


@dataclass(frozen=True)
class PluginField:
    name: str
    label: str
    field_type: str
    required: bool = False
    default: Any = None
    placeholder: str = ''
    help_text: str = ''
    options: tuple[PluginFieldOption, ...] = ()

    def serialize(self) -> dict[str, Any]:
        payload = {
            'name': self.name,
            'label': self.label,
            'type': self.field_type,
            'required': self.required,
            'default': self.default,
            'placeholder': self.placeholder,
            'helpText': self.help_text,
        }

        if self.options:
            payload['options'] = [option.serialize() for option in self.options]

        return payload


@dataclass(frozen=True)
class PluginManifest:
    plugin_id: str
    name: str
    description: str
    default_refresh_interval_seconds: int
    settings_schema: tuple[PluginField, ...] = ()
    design_schema: tuple[PluginField, ...] = ()

    def serialize(self) -> dict[str, Any]:
        return {
            'id': self.plugin_id,
            'name': self.name,
            'description': self.description,
            'defaultRefreshIntervalSeconds': self.default_refresh_interval_seconds,
            'settingsSchema': [field.serialize() for field in self.settings_schema],
            'designSchema': [field.serialize() for field in self.design_schema],
        }


@dataclass(frozen=True)
class PluginContext:
    cols: int
    rows: int


@dataclass
class PluginRefreshResult:
    lines: list[str]
    meta: dict[str, Any] = field(default_factory=dict)


class ScreenPlugin:
    manifest: PluginManifest

    async def refresh(
        self,
        *,
        settings: dict[str, Any],
        design: dict[str, Any],
        context: PluginContext,
        http_session: ClientSession,
    ) -> PluginRefreshResult:
        raise NotImplementedError

    def placeholder_lines(
        self,
        *,
        settings: dict[str, Any],
        design: dict[str, Any],
        context: PluginContext,
        error: str | None = None,
    ) -> list[str]:
        label = design.get('title') or self.manifest.name
        lines = [
            '',
            label.upper()[: context.cols],
            (error or 'NO DATA').upper()[: context.cols],
        ]
        return lines[: context.rows]
