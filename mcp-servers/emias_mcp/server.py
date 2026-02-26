#!/usr/bin/env python3
"""
EMIAS MCP Server

Интеграция с Единой медицинской информационно-аналитической системой (ЕМИАС)
Model Context Protocol server для экспорта и синхронизации данных пациентов.

MVP Implementation: Демонстрирует паттерн интеграции с mock responses.
Production: Требует реализации реальных API endpoints на backend.
"""

import sys
import logging
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Configure logging to stderr (never stdout for stdio transport)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Constants
CHARACTER_LIMIT = 25000
API_BASE_URL = "https://api.beercut.tech"

# Initialize FastMCP server
mcp = FastMCP("emias_mcp")

# ============================================================================
# Enums and Types
# ============================================================================

class Gender(str, Enum):
    """Пол пациента"""
    MALE = "male"
    FEMALE = "female"

class SyncStatus(str, Enum):
    """Статус синхронизации"""
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"
    NOT_SYNCED = "not_synced"

class ResponseFormat(str, Enum):
    """Формат ответа"""
    JSON = "json"
    MARKDOWN = "markdown"

# ============================================================================
# Pydantic Models for Input Validation
# ============================================================================

class PatientData(BaseModel):
    """Данные пациента для валидации и экспорта"""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    patient_id: int = Field(
        ...,
        description="ID пациента в системе (e.g., 123, 456)",
        gt=0
    )
    first_name: str = Field(
        ...,
        description="Имя пациента (e.g., 'Иван', 'Мария')",
        min_length=1,
        max_length=100
    )
    last_name: str = Field(
        ...,
        description="Фамилия пациента (e.g., 'Иванов', 'Петрова')",
        min_length=1,
        max_length=100
    )
    middle_name: Optional[str] = Field(
        default=None,
        description="Отчество пациента (e.g., 'Петрович', 'Сергеевна')",
        max_length=100
    )
    date_of_birth: str = Field(
        ...,
        description="Дата рождения в формате YYYY-MM-DD (e.g., '1980-05-15', '1995-12-30')",
        pattern=r'^\d{4}-\d{2}-\d{2}$'
    )
    gender: Gender = Field(
        ...,
        description="Пол пациента: 'male' или 'female'"
    )
    snils: Optional[str] = Field(
        default=None,
        description="СНИЛС в формате XXX-XXX-XXX XX (e.g., '123-456-789 00')",
        pattern=r'^\d{3}-\d{3}-\d{3} \d{2}$'
    )
    oms_policy: Optional[str] = Field(
        default=None,
        description="Номер полиса ОМС (e.g., '1234567890123456')",
        min_length=16,
        max_length=16
    )
    address: Optional[str] = Field(
        default=None,
        description="Адрес регистрации (e.g., 'г. Москва, ул. Ленина, д. 1, кв. 10')",
        max_length=500
    )
    phone: Optional[str] = Field(
        default=None,
        description="Телефон в формате +7XXXXXXXXXX (e.g., '+79161234567')",
        pattern=r'^\+7\d{10}$'
    )
    diagnosis_code: Optional[str] = Field(
        default=None,
        description="Код диагноза МКБ-10 (e.g., 'H25.1', 'H26.0')",
        pattern=r'^[A-Z]\d{2}(\.\d{1,2})?$'
    )
    procedure_code: Optional[str] = Field(
        default=None,
        description="Код процедуры SNOMED CT (e.g., '54885007', '397544007')"
    )

class ValidatePatientInput(BaseModel):
    """Входные данные для валидации пациента"""
    model_config = ConfigDict(extra='forbid')

    patient: PatientData = Field(
        ...,
        description="Данные пациента для валидации"
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="Формат ответа: 'json' или 'markdown'"
    )

class ExportPatientInput(BaseModel):
    """Входные данные для экспорта пациента"""
    model_config = ConfigDict(extra='forbid')

    patient_id: int = Field(
        ...,
        description="ID пациента для экспорта (e.g., 123, 456)",
        gt=0
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="Формат ответа: 'json' или 'markdown'"
    )

class SyncStatusInput(BaseModel):
    """Входные данные для проверки статуса синхронизации"""
    model_config = ConfigDict(extra='forbid')

    patient_id: int = Field(
        ...,
        description="ID пациента (e.g., 123, 456)",
        gt=0
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="Формат ответа: 'json' или 'markdown'"
    )

# ============================================================================
# Helper Functions
# ============================================================================

def validate_patient_data(patient: PatientData) -> Dict[str, Any]:
    """
    Валидация данных пациента для экспорта в ЕМИАС

    Returns:
        Dict с полями: valid, errors, warnings, missing_fields
    """
    errors: List[str] = []
    warnings: List[str] = []
    missing_fields: List[str] = []

    # Обязательные поля уже проверены Pydantic (first_name, last_name, date_of_birth, gender)

    # Рекомендуемые поля
    if not patient.snils:
        warnings.append("СНИЛС не указан - рекомендуется для идентификации")
        missing_fields.append("snils")

    if not patient.oms_policy:
        warnings.append("Полис ОМС не указан - может потребоваться для оплаты")
        missing_fields.append("oms_policy")

    if not patient.phone:
        warnings.append("Телефон не указан - затруднит связь с пациентом")
        missing_fields.append("phone")

    if not patient.address:
        warnings.append("Адрес не указан - рекомендуется для регистрации")
        missing_fields.append("address")

    # Медицинские коды
    if not patient.diagnosis_code:
        warnings.append("Код диагноза МКБ-10 не указан - рекомендуется для статистики")
        missing_fields.append("diagnosis_code")

    if not patient.procedure_code:
        warnings.append("Код процедуры SNOMED не указан - рекомендуется для учета")
        missing_fields.append("procedure_code")

    return {
        "system": "emias",
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "missing_fields": missing_fields if missing_fields else None
    }

def format_validation_markdown(validation: Dict[str, Any], patient: PatientData) -> str:
    """Форматирование результата валидации в Markdown"""
    status_emoji = "✅" if validation["valid"] else "❌"

    result = f"""# Валидация пациента для ЕМИАС {status_emoji}

## Пациент
- **ID**: {patient.patient_id}
- **ФИО**: {patient.last_name} {patient.first_name} {patient.middle_name or ''}
- **Дата рождения**: {patient.date_of_birth}
- **Пол**: {patient.gender.value}

## Статус валидации
- **Система**: ЕМИАС
- **Результат**: {'✅ Готов к экспорту' if validation['valid'] else '❌ Требуется доработка'}
"""

    if validation["errors"]:
        result += "\n## ❌ Ошибки (обязательно исправить)\n"
        for error in validation["errors"]:
            result += f"- {error}\n"

    if validation["warnings"]:
        result += "\n## ⚠️ Предупреждения (рекомендуется заполнить)\n"
        for warning in validation["warnings"]:
            result += f"- {warning}\n"

    if validation["missing_fields"]:
        result += f"\n## Отсутствующие поля\n"
        result += f"- {', '.join(validation['missing_fields'])}\n"

    result += "\n---\n"
    result += "**Примечание**: MVP implementation с mock валидацией. "
    result += "Production версия требует реализации backend API.\n"

    return result

def format_export_markdown(export_result: Dict[str, Any], patient_id: int) -> str:
    """Форматирование результата экспорта в Markdown"""
    status_emoji = "✅" if export_result["success"] else "❌"

    result = f"""# Экспорт пациента в ЕМИАС {status_emoji}

## Результат
- **Пациент ID**: {patient_id}
- **Статус**: {'✅ Успешно экспортирован' if export_result['success'] else '❌ Ошибка экспорта'}
"""

    if export_result["success"]:
        result += f"- **ЕМИАС ID**: {export_result['external_id']}\n"
        result += f"- **Время**: {export_result['timestamp']}\n"
    else:
        result += f"- **Ошибка**: {export_result.get('error', 'Unknown error')}\n"
        if export_result.get('error_code'):
            result += f"- **Код ошибки**: {export_result['error_code']}\n"

    result += "\n---\n"
    result += "**Примечание**: MVP implementation с mock экспортом. "
    result += "Production версия требует реализации backend API endpoints.\n"

    return result

def format_sync_status_markdown(sync_result: Dict[str, Any]) -> str:
    """Форматирование статуса синхронизации в Markdown"""
    status_map = {
        "synced": "✅ Синхронизирован",
        "pending": "⏳ Ожидает синхронизации",
        "failed": "❌ Ошибка синхронизации",
        "not_synced": "⚪ Не синхронизирован"
    }

    result = f"""# Статус синхронизации с ЕМИАС

## Информация
- **Система**: ЕМИАС
- **Статус**: {status_map.get(sync_result['status'], sync_result['status'])}
"""

    if sync_result.get('patient_id'):
        result += f"- **ЕМИАС ID**: {sync_result['patient_id']}\n"

    if sync_result.get('last_sync_at'):
        result += f"- **Последняя синхронизация**: {sync_result['last_sync_at']}\n"

    if sync_result.get('error'):
        result += f"\n## ❌ Ошибка\n{sync_result['error']}\n"

    result += "\n---\n"
    result += "**Примечание**: MVP implementation с mock статусом. "
    result += "Production версия требует реализации backend API.\n"

    return result

def truncate_if_needed(content: str) -> str:
    """Обрезка контента если превышен лимит символов"""
    if len(content) <= CHARACTER_LIMIT:
        return content

    truncated = content[:CHARACTER_LIMIT]
    truncated += f"\n\n... [TRUNCATED: Response exceeded {CHARACTER_LIMIT} character limit]"
    return truncated

# ============================================================================
# MCP Tools
# ============================================================================

@mcp.tool(
    name="emias_validate_patient",
    annotations={
        "title": "Validate Patient for EMIAS Export",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def validate_patient(input_data: ValidatePatientInput) -> str:
    """
    Валидация данных пациента для экспорта в ЕМИАС.

    Проверяет наличие обязательных полей и предупреждает об отсутствующих
    рекомендуемых данных. Не выполняет реальный API вызов.

    Args:
        input_data: Данные пациента и формат ответа

    Returns:
        Результат валидации в выбранном формате (JSON или Markdown)

    Examples:
        - Валидация пациента с полными данными
        - Валидация пациента с минимальными данными
        - Проверка перед экспортом

    Errors:
        - Если обязательные поля отсутствуют или некорректны
        - Если формат данных не соответствует требованиям ЕМИАС
    """
    try:
        logger.info(f"Validating patient {input_data.patient.patient_id} for EMIAS")

        validation_result = validate_patient_data(input_data.patient)

        if input_data.response_format == ResponseFormat.JSON:
            import json
            response = {
                "validation": validation_result,
                "patient": input_data.patient.model_dump()
            }
            return truncate_if_needed(json.dumps(response, ensure_ascii=False, indent=2))
        else:
            return truncate_if_needed(
                format_validation_markdown(validation_result, input_data.patient)
            )

    except Exception as e:
        logger.error(f"Error validating patient: {e}", exc_info=True)
        return f"❌ Ошибка валидации: {str(e)}"

@mcp.tool(
    name="emias_export_patient",
    annotations={
        "title": "Export Patient to EMIAS",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def export_patient(input_data: ExportPatientInput) -> str:
    """
    Экспорт пациента в систему ЕМИАС.

    MVP: Возвращает mock response. Production версия должна выполнять
    реальный API вызов к backend для экспорта в ЕМИАС.

    Args:
        input_data: ID пациента и формат ответа

    Returns:
        Результат экспорта с ЕМИАС ID в выбранном формате

    Examples:
        - Экспорт нового пациента
        - Повторный экспорт (идемпотентная операция)

    Errors:
        - Если пациент не найден
        - Если данные пациента не прошли валидацию
        - Если ЕМИАС API недоступен

    Next Steps:
        После успешного экспорта используйте emias_get_sync_status для
        проверки статуса синхронизации.
    """
    try:
        logger.info(f"Exporting patient {input_data.patient_id} to EMIAS")

        # MVP: Mock response
        # Production: await backend_api.export_to_emias(patient_id)
        export_result = {
            "success": True,
            "external_id": f"EMIAS-{input_data.patient_id}-{int(datetime.now().timestamp())}",
            "timestamp": datetime.now().isoformat()
        }

        if input_data.response_format == ResponseFormat.JSON:
            import json
            return truncate_if_needed(json.dumps(export_result, ensure_ascii=False, indent=2))
        else:
            return truncate_if_needed(
                format_export_markdown(export_result, input_data.patient_id)
            )

    except Exception as e:
        logger.error(f"Error exporting patient: {e}", exc_info=True)
        return f"❌ Ошибка экспорта: {str(e)}"

@mcp.tool(
    name="emias_get_sync_status",
    annotations={
        "title": "Get EMIAS Sync Status",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def get_sync_status(input_data: SyncStatusInput) -> str:
    """
    Получение статуса синхронизации пациента с ЕМИАС.

    Проверяет текущий статус синхронизации и время последнего обновления.
    MVP: Возвращает mock статус. Production: реальный API вызов.

    Args:
        input_data: ID пациента и формат ответа

    Returns:
        Статус синхронизации (synced/pending/failed/not_synced)

    Examples:
        - Проверка после экспорта
        - Мониторинг статуса синхронизации

    Errors:
        - Если пациент не найден
        - Если ЕМИАС API недоступен
    """
    try:
        logger.info(f"Getting EMIAS sync status for patient {input_data.patient_id}")

        # MVP: Mock response
        # Production: await backend_api.get_emias_sync_status(patient_id)
        sync_result = {
            "system": "emias",
            "status": "synced",
            "patient_id": f"EMIAS-{input_data.patient_id}",
            "last_sync_at": datetime.now().isoformat()
        }

        if input_data.response_format == ResponseFormat.JSON:
            import json
            return truncate_if_needed(json.dumps(sync_result, ensure_ascii=False, indent=2))
        else:
            return truncate_if_needed(format_sync_status_markdown(sync_result))

    except Exception as e:
        logger.error(f"Error getting sync status: {e}", exc_info=True)
        return f"❌ Ошибка получения статуса: {str(e)}"

# ============================================================================
# Server Entry Point
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting EMIAS MCP Server")
    mcp.run()
