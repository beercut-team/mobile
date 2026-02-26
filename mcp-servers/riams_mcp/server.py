#!/usr/bin/env python3
"""
RIAMS MCP Server

Интеграция с Региональной информационно-аналитической медицинской системой (РИАМС)
Model Context Protocol server для экспорта и синхронизации данных пациентов в региональные системы.

Поддерживаемые регионы:
- Москва (Moscow)
- Санкт-Петербург (Saint Petersburg)
- Московская область (Moscow Region)
- Ленинградская область (Leningrad Region)
- Свердловская область (Sverdlovsk Region)
- Новосибирская область (Novosibirsk Region)
- Краснодарский край (Krasnodar Region)
- Татарстан (Tatarstan)
- Нижегородская область (Nizhny Novgorod Region)
- Челябинская область (Chelyabinsk Region)

MVP Implementation: Демонстрирует паттерн интеграции с mock responses.
Production: Требует реализации реальных API endpoints на backend.
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from enum import Enum
from typing import Any, Optional

import structlog
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, TextContent, Tool
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()

# Configuration
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "https://api.beercut.tech")
BACKEND_API_TOKEN = os.getenv("BACKEND_API_TOKEN", "")
RIAMS_MOCK_MODE = os.getenv("RIAMS_MOCK_MODE", "true").lower() == "true"


class RIAMSRegion(str, Enum):
    """Supported RIAMS regions"""

    MOSCOW = "moscow"
    SAINT_PETERSBURG = "saint_petersburg"
    MOSCOW_REGION = "moscow_region"
    LENINGRAD_REGION = "leningrad_region"
    SVERDLOVSK_REGION = "sverdlovsk_region"
    NOVOSIBIRSK_REGION = "novosibirsk_region"
    KRASNODAR_REGION = "krasnodar_region"
    TATARSTAN = "tatarstan"
    NIZHNY_NOVGOROD_REGION = "nizhny_novgorod_region"
    CHELYABINSK_REGION = "chelyabinsk_region"


REGION_NAMES = {
    RIAMSRegion.MOSCOW: "Москва",
    RIAMSRegion.SAINT_PETERSBURG: "Санкт-Петербург",
    RIAMSRegion.MOSCOW_REGION: "Московская область",
    RIAMSRegion.LENINGRAD_REGION: "Ленинградская область",
    RIAMSRegion.SVERDLOVSK_REGION: "Свердловская область",
    RIAMSRegion.NOVOSIBIRSK_REGION: "Новосибирская область",
    RIAMSRegion.KRASNODAR_REGION: "Краснодарский край",
    RIAMSRegion.TATARSTAN: "Республика Татарстан",
    RIAMSRegion.NIZHNY_NOVGOROD_REGION: "Нижегородская область",
    RIAMSRegion.CHELYABINSK_REGION: "Челябинская область",
}


class ValidationResult(BaseModel):
    """Result of patient validation for RIAMS export"""

    valid: bool
    patient_id: str
    region: str
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ExportResult(BaseModel):
    """Result of patient export to RIAMS"""

    success: bool
    patient_id: str
    region: str
    riams_id: Optional[str] = None
    status: str
    exported_at: Optional[str] = None
    error: Optional[str] = None


class SyncStatus(BaseModel):
    """RIAMS synchronization status"""

    patient_id: str
    region: str
    riams_id: Optional[str] = None
    status: str
    last_sync: Optional[str] = None
    sync_count: int = 0


# Initialize MCP server
app = Server("riams-mcp-server")


def validate_snils(snils: str) -> bool:
    """Validate SNILS format (XXX-XXX-XXX-XX)"""
    if not snils:
        return False
    # Remove dashes
    digits = snils.replace("-", "").replace(" ", "")
    if len(digits) != 11 or not digits.isdigit():
        return False
    return True


def validate_oms_policy(policy: str) -> bool:
    """Validate OMS policy format (16 digits)"""
    if not policy:
        return False
    digits = policy.replace(" ", "").replace("-", "")
    return len(digits) == 16 and digits.isdigit()


async def mock_validate_patient(patient_id: str, region: str) -> ValidationResult:
    """Mock validation for MVP"""
    await asyncio.sleep(0.5)  # Simulate network delay

    # Simulate validation logic
    errors = []
    warnings = []

    # Mock: assume patient 999 has validation errors
    if patient_id == "999":
        errors.append("Отсутствует СНИЛС")
        errors.append("Отсутствует полис ОМС")
        errors.append("Не указан диагноз")

    # Mock: patient 888 has warnings
    if patient_id == "888":
        warnings.append("Рекомендуется указать email для уведомлений")
        warnings.append("Отсутствует адрес регистрации")

    return ValidationResult(
        valid=len(errors) == 0,
        patient_id=patient_id,
        region=region,
        errors=errors,
        warnings=warnings,
    )


async def mock_export_patient(patient_id: str, region: str) -> ExportResult:
    """Mock export for MVP"""
    await asyncio.sleep(1.0)  # Simulate network delay

    # Simulate export logic
    if patient_id == "999":
        return ExportResult(
            success=False,
            patient_id=patient_id,
            region=region,
            status="failed",
            error="Пациент не прошел валидацию",
        )

    # Generate mock RIAMS ID
    region_code = region.upper()[:3]
    riams_id = f"RIAMS-{region_code}-2026-{patient_id.zfill(6)}"

    return ExportResult(
        success=True,
        patient_id=patient_id,
        region=region,
        riams_id=riams_id,
        status="exported",
        exported_at=datetime.utcnow().isoformat() + "Z",
    )


async def mock_get_sync_status(patient_id: str, region: str) -> SyncStatus:
    """Mock sync status for MVP"""
    await asyncio.sleep(0.3)

    # Simulate sync status
    if patient_id == "999":
        return SyncStatus(
            patient_id=patient_id,
            region=region,
            status="not_exported",
            sync_count=0,
        )

    region_code = region.upper()[:3]
    riams_id = f"RIAMS-{region_code}-2026-{patient_id.zfill(6)}"

    return SyncStatus(
        patient_id=patient_id,
        region=region,
        riams_id=riams_id,
        status="synced",
        last_sync=datetime.utcnow().isoformat() + "Z",
        sync_count=3,
    )


@app.list_resources()
async def list_resources() -> list[Resource]:
    """List available RIAMS resources"""
    return [
        Resource(
            uri="riams://integration-status",
            name="RIAMS Integration Status",
            mimeType="application/json",
            description="Общий статус интеграции с РИАМС по всем регионам",
        ),
        Resource(
            uri="riams://supported-regions",
            name="Supported RIAMS Regions",
            mimeType="application/json",
            description="Список поддерживаемых регионов РИАМС",
        ),
        Resource(
            uri="riams://validation-rules",
            name="RIAMS Validation Rules",
            mimeType="application/json",
            description="Правила валидации данных для экспорта в РИАМС",
        ),
    ]


@app.read_resource()
async def read_resource(uri: str) -> str:
    """Read RIAMS resource content"""
    logger.info("Reading resource", uri=uri)

    if uri == "riams://integration-status":
        # Mock integration status
        status = {
            "total_exported": 156,
            "by_region": {
                "moscow": {"exported": 45, "pending": 3, "failed": 1},
                "saint_petersburg": {"exported": 32, "pending": 2, "failed": 0},
                "moscow_region": {"exported": 28, "pending": 1, "failed": 0},
                "other_regions": {"exported": 51, "pending": 4, "failed": 2},
            },
            "last_sync": datetime.utcnow().isoformat() + "Z",
            "mock_mode": RIAMS_MOCK_MODE,
        }
        return json.dumps(status, ensure_ascii=False, indent=2)

    elif uri == "riams://supported-regions":
        regions = [
            {"code": region.value, "name": REGION_NAMES[region]}
            for region in RIAMSRegion
        ]
        return json.dumps(
            {"regions": regions, "total": len(regions)}, ensure_ascii=False, indent=2
        )

    elif uri == "riams://validation-rules":
        rules = {
            "required_fields": [
                "full_name",
                "birth_date",
                "snils",
                "oms_policy",
                "diagnosis",
                "operation_type",
                "region",
            ],
            "snils_format": "XXX-XXX-XXX-XX (11 цифр)",
            "oms_policy_format": "16 цифр",
            "diagnosis_format": "Код МКБ-10 (ICD-10)",
            "operation_type_format": "Код процедуры (SNOMED CT)",
            "regional_requirements": {
                "moscow": ["Требуется адрес регистрации в Москве"],
                "saint_petersburg": ["Требуется адрес регистрации в СПб"],
                "other": ["Требуется адрес регистрации в соответствующем регионе"],
            },
        }
        return json.dumps(rules, ensure_ascii=False, indent=2)

    raise ValueError(f"Unknown resource: {uri}")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available RIAMS tools"""
    return [
        Tool(
            name="validate_patient_for_riams",
            description="Валидация данных пациента перед экспортом в РИАМС региона",
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "ID пациента для валидации",
                    },
                    "region": {
                        "type": "string",
                        "enum": [r.value for r in RIAMSRegion],
                        "description": "Регион РИАМС для экспорта",
                    },
                },
                "required": ["patient_id", "region"],
            },
        ),
        Tool(
            name="export_patient_to_riams",
            description="Экспорт данных пациента в РИАМС региона",
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "ID пациента для экспорта",
                    },
                    "region": {
                        "type": "string",
                        "enum": [r.value for r in RIAMSRegion],
                        "description": "Регион РИАМС для экспорта",
                    },
                },
                "required": ["patient_id", "region"],
            },
        ),
        Tool(
            name="get_riams_sync_status",
            description="Получение статуса синхронизации пациента с РИАМС",
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "ID пациента",
                    },
                    "region": {
                        "type": "string",
                        "enum": [r.value for r in RIAMSRegion],
                        "description": "Регион РИАМС",
                    },
                },
                "required": ["patient_id", "region"],
            },
        ),
        Tool(
            name="get_riams_export_history",
            description="История экспортов пациентов в РИАМС по региону",
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {
                        "type": "string",
                        "enum": [r.value for r in RIAMSRegion],
                        "description": "Регион РИАМС для фильтрации",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["all", "success", "pending", "failed"],
                        "description": "Фильтр по статусу экспорта",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Максимальное количество записей",
                        "default": 50,
                    },
                },
                "required": ["region"],
            },
        ),
        Tool(
            name="list_riams_regions",
            description="Получение списка всех поддерживаемых регионов РИАМС",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle RIAMS tool calls"""
    logger.info("Tool called", tool=name, arguments=arguments)

    try:
        if name == "validate_patient_for_riams":
            patient_id = arguments["patient_id"]
            region = arguments["region"]

            logger.info("Validating patient for RIAMS", patient_id=patient_id, region=region)

            if RIAMS_MOCK_MODE:
                result = await mock_validate_patient(patient_id, region)
            else:
                # TODO: Call real backend API
                raise NotImplementedError("Production RIAMS API not implemented")

            logger.info(
                "Patient validated",
                patient_id=patient_id,
                region=region,
                valid=result.valid,
            )

            return [
                TextContent(
                    type="text",
                    text=json.dumps(result.model_dump(), ensure_ascii=False, indent=2),
                )
            ]

        elif name == "export_patient_to_riams":
            patient_id = arguments["patient_id"]
            region = arguments["region"]

            logger.info("Exporting patient to RIAMS", patient_id=patient_id, region=region)

            if RIAMS_MOCK_MODE:
                result = await mock_export_patient(patient_id, region)
            else:
                # TODO: Call real backend API
                raise NotImplementedError("Production RIAMS API not implemented")

            if result.success:
                logger.info(
                    "Patient exported successfully",
                    patient_id=patient_id,
                    region=region,
                    riams_id=result.riams_id,
                )
            else:
                logger.error(
                    "Patient export failed",
                    patient_id=patient_id,
                    region=region,
                    error=result.error,
                )

            return [
                TextContent(
                    type="text",
                    text=json.dumps(result.model_dump(), ensure_ascii=False, indent=2),
                )
            ]

        elif name == "get_riams_sync_status":
            patient_id = arguments["patient_id"]
            region = arguments["region"]

            logger.info("Getting RIAMS sync status", patient_id=patient_id, region=region)

            if RIAMS_MOCK_MODE:
                result = await mock_get_sync_status(patient_id, region)
            else:
                # TODO: Call real backend API
                raise NotImplementedError("Production RIAMS API not implemented")

            return [
                TextContent(
                    type="text",
                    text=json.dumps(result.model_dump(), ensure_ascii=False, indent=2),
                )
            ]

        elif name == "get_riams_export_history":
            region = arguments["region"]
            status_filter = arguments.get("status", "all")
            limit = arguments.get("limit", 50)

            logger.info(
                "Getting RIAMS export history",
                region=region,
                status=status_filter,
                limit=limit,
            )

            # Mock export history
            history = {
                "region": region,
                "region_name": REGION_NAMES.get(RIAMSRegion(region), region),
                "total": 45,
                "exports": [
                    {
                        "patient_id": f"{i}",
                        "riams_id": f"RIAMS-{region.upper()[:3]}-2026-{str(i).zfill(6)}",
                        "status": "success" if i % 10 != 0 else "pending",
                        "exported_at": datetime.utcnow().isoformat() + "Z",
                    }
                    for i in range(1, min(limit + 1, 46))
                ],
            }

            return [
                TextContent(
                    type="text",
                    text=json.dumps(history, ensure_ascii=False, indent=2),
                )
            ]

        elif name == "list_riams_regions":
            logger.info("Listing RIAMS regions")

            regions = [
                {
                    "code": region.value,
                    "name": REGION_NAMES[region],
                    "status": "active",
                }
                for region in RIAMSRegion
            ]

            result = {
                "total": len(regions),
                "regions": regions,
            }

            return [
                TextContent(
                    type="text",
                    text=json.dumps(result, ensure_ascii=False, indent=2),
                )
            ]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        logger.error("Tool execution failed", tool=name, error=str(e))
        return [
            TextContent(
                type="text",
                text=json.dumps(
                    {"error": str(e), "tool": name}, ensure_ascii=False, indent=2
                ),
            )
        ]


async def main():
    """Run the RIAMS MCP server"""
    logger.info(
        "Starting RIAMS MCP server",
        backend_url=BACKEND_API_URL,
        mock_mode=RIAMS_MOCK_MODE,
        regions=len(RIAMSRegion),
    )

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
