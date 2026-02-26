# EMIAS MCP Server

Model Context Protocol server для интеграции с Единой медицинской информационно-аналитической системой (ЕМИАС) города Москвы.

## Описание

Этот MCP-сервер предоставляет инструменты для экспорта и синхронизации данных пациентов с системой ЕМИАС. Поддерживает валидацию данных, экспорт пациентов, проверку статуса синхронизации и получение истории операций.

## Возможности

### Tools (Инструменты)

1. **validate_patient_for_emias** - Валидация данных пациента перед экспортом
   - Проверяет обязательные поля (ФИО, дата рождения, СНИЛС, полис ОМС)
   - Валидирует формат СНИЛС и полиса ОМС
   - Проверяет наличие диагноза и типа операции
   - Возвращает список ошибок или подтверждение готовности

2. **export_patient_to_emias** - Экспорт пациента в ЕМИАС
   - Отправляет данные пациента в систему ЕМИАС
   - Возвращает EMIAS ID и статус экспорта
   - Сохраняет метаданные интеграции в БД

3. **get_emias_sync_status** - Получение статуса синхронизации
   - Проверяет текущий статус пациента в ЕМИАС
   - Возвращает EMIAS ID, статус, дату последней синхронизации
   - Показывает историю изменений статуса

4. **get_emias_export_history** - История экспортов в ЕМИАС
   - Получает список всех экспортированных пациентов
   - Фильтрация по статусу (success, pending, failed)
   - Сортировка по дате экспорта

### Resources (Ресурсы)

1. **emias://integration-status** - Общий статус интеграции с ЕМИАС
   - Количество экспортированных пациентов
   - Статистика по статусам
   - Информация о последней синхронизации

2. **emias://validation-rules** - Правила валидации для ЕМИАС
   - Требования к обязательным полям
   - Форматы СНИЛС и полиса ОМС
   - Ограничения и требования системы

## Установка

```bash
cd mcp-servers/emias_mcp
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Конфигурация

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Настройте переменные окружения:

```env
# Backend API
BACKEND_API_URL=https://api.beercut.tech
BACKEND_API_TOKEN=your_jwt_token_here

# EMIAS API (для production)
EMIAS_API_URL=https://emias.mos.ru/api/v1
EMIAS_API_KEY=your_emias_api_key
EMIAS_ORG_ID=your_organization_id

# Режим работы
EMIAS_MOCK_MODE=true  # true для MVP с mock responses, false для production
```

## Использование

### Запуск сервера

```bash
python server.py
```

Сервер будет доступен через MCP protocol на stdio.

### Интеграция с Claude Desktop

Добавьте в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "emias": {
      "command": "python",
      "args": ["/path/to/mcp-servers/emias_mcp/server.py"],
      "env": {
        "BACKEND_API_URL": "https://api.beercut.tech",
        "BACKEND_API_TOKEN": "your_token",
        "EMIAS_MOCK_MODE": "true"
      }
    }
  }
}
```

### Примеры использования

#### Валидация пациента

```python
# Claude может использовать этот tool:
validate_patient_for_emias(patient_id="123")

# Ответ:
{
  "valid": true,
  "patient_id": "123",
  "errors": [],
  "warnings": ["Рекомендуется указать email для уведомлений"]
}
```

#### Экспорт пациента

```python
export_patient_to_emias(patient_id="123")

# Ответ:
{
  "success": true,
  "emias_id": "EMIAS-2026-001234",
  "status": "exported",
  "exported_at": "2026-02-27T15:30:00Z"
}
```

#### Проверка статуса

```python
get_emias_sync_status(patient_id="123")

# Ответ:
{
  "patient_id": "123",
  "emias_id": "EMIAS-2026-001234",
  "status": "synced",
  "last_sync": "2026-02-27T15:30:00Z",
  "sync_count": 3
}
```

## Архитектура

### MVP Implementation (текущая)

- Использует mock responses для демонстрации паттерна интеграции
- Не требует реальных EMIAS API credentials
- Симулирует задержки сети и различные сценарии ответов
- Идеально для разработки и тестирования

### Production Implementation (требуется)

Для production необходимо:

1. **Backend API endpoints** (`/api/integrations/emias/`):
   - `POST /validate` - валидация данных
   - `POST /export` - экспорт пациента
   - `GET /status/:patientId` - статус синхронизации
   - `GET /history` - история экспортов

2. **EMIAS API интеграция**:
   - Реальные credentials (API key, org ID)
   - OAuth 2.0 аутентификация
   - Обработка rate limits
   - Retry logic для failed requests

3. **Безопасность**:
   - Шифрование sensitive данных
   - Audit logging всех операций
   - Валидация прав доступа
   - HTTPS для всех запросов

## Требования к данным

### Обязательные поля

- **ФИО**: Полное имя пациента (фамилия, имя, отчество)
- **Дата рождения**: В формате YYYY-MM-DD
- **СНИЛС**: 11 цифр в формате XXX-XXX-XXX-XX
- **Полис ОМС**: 16 цифр
- **Диагноз**: Код по МКБ-10 (ICD-10)
- **Тип операции**: Код процедуры (SNOMED CT)

### Опциональные поля

- Email, телефон
- Адрес регистрации
- Группа крови
- Аллергии
- Результаты анализов (LOINC codes)

## Обработка ошибок

Сервер возвращает структурированные ошибки:

```json
{
  "error": "validation_failed",
  "message": "Пациент не готов к экспорту",
  "details": {
    "missing_fields": ["snils", "oms_policy"],
    "invalid_fields": ["birth_date"]
  }
}
```

## Логирование

Все операции логируются с использованием structlog:

```
2026-02-27 15:30:00 [info] Validating patient patient_id=123
2026-02-27 15:30:01 [info] Patient validated successfully patient_id=123 valid=true
2026-02-27 15:30:02 [info] Exporting patient to EMIAS patient_id=123
2026-02-27 15:30:05 [info] Patient exported successfully patient_id=123 emias_id=EMIAS-2026-001234
```

## Тестирование

```bash
# Запуск в mock режиме
EMIAS_MOCK_MODE=true python server.py

# Тестирование через MCP inspector
npx @modelcontextprotocol/inspector python server.py
```

## Roadmap

- [ ] Реализация реальных EMIAS API endpoints на backend
- [ ] OAuth 2.0 аутентификация
- [ ] Batch export (массовый экспорт пациентов)
- [ ] Webhook notifications от EMIAS
- [ ] Автоматическая синхронизация по расписанию
- [ ] Dashboard для мониторинга интеграции
- [ ] Поддержка FHIR R4 формата

## Поддержка

Для вопросов и проблем создавайте issue в репозитории проекта.

## Лицензия

MIT
