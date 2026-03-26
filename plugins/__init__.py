from __future__ import annotations

import importlib
from pathlib import Path

from .base import ScreenPlugin


def load_plugins() -> dict[str, ScreenPlugin]:
    plugins: dict[str, ScreenPlugin] = {}
    plugins_dir = Path(__file__).resolve().parent

    for plugin_file in sorted(plugins_dir.glob('*.py')):
        if plugin_file.stem in {'__init__', 'base'}:
            continue

        module = importlib.import_module(f'plugins.{plugin_file.stem}')
        plugin = getattr(module, 'PLUGIN', None)
        if plugin is None:
            continue

        plugins[plugin.manifest.plugin_id] = plugin

    return plugins
