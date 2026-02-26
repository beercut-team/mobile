# RIAMS MCP Server

Model Context Protocol server для интеграции с Региональной информационно-аналитической медицинской системой (РИАМС).

## Описание

Этот MCP-сервер предоставляет инструменты для экспорта и синхронизации данных пациентов с региональными медицинскими информационными системами России. Поддерживает 10 регионов с единым API интерфейсом.

## Поддерживаемые регионы

1. **Москва** (moscow)
2. **Санкт-Петербург** (saint_petersburg)
3. **Московская область** (moscow_region)
4. **Ленинградская область** (leningrad_region)
5. **Свердловская область** (sverdlovsk_region)
6. **Новосибирская область** (novosibirsk_region)
7. **Краснодарский край** (krasnodar_region)
8. **Республика Татарстан** (tatarstan)
9. **Нижегородская область** (nizhny_novgorod_region)
10. **Челябинская область** (chelyabinsk_region)

## Возможности

### Tools (Инструменты)

1. **validate_patient_for_riams** - Валидация данных пациента перед экспортом
   - Проверяет обязательные поля для конкретного региона
   - Валидирует формат СНИЛС и полиса ОМС
   - Проверяет региональные требования
   - Возвращает список ошибок или подтверждение готовности

2. **export_patient_to_riams** - Экспорт пациента в РИАМС региона
   - Отправляет данные пациента в региональную систему
   - Возвращает RIAMS ID и статус экспорта
   - Сохраняет метаданные интеграции в БД

3. **get_riams_sync_status** - Получение статуса синхронизации
   - Проверяет текущий статус пациента в РИАМС региона
   - Возвращает RIAMS ID, статус, дату последней синхронизации
   - Показывает историю изменений статуса

4. **get_riams_export_history** - История экспортов в РИАМС
   - Получает список всех экспортированных пациентов по региону
   - Фильтрация по статусу (success, pending, failed)
   - Сортировка по дате экспорта

5. **list_riams_regions** - Список поддерживаемых регионов
   - Возвращает все доступные регионы РИАМС
   - Показывает статус каждого региона
   - Полезно для UI выбора региона

### Resources (Ресурсы)

1. **riams://integration-status** - Общий статус интеграции с РИАМС
   - Количество экспортированных пациентов по регионам
   - Статистика по статусам
   - Информация о последней синхронизации

2. **riams://supported-regions** - Список поддерживаемых регионов
   - Коды и названия регионов
   - Статус доступности каждого региона

3. **riams://validation-rules** - Правила валидации для РИАМС
   - Требования к обязательным полям
   - Форматы СНИЛС и полиса ОМС
   - Региональные особенности

## Установка

```bash
cd mcp-servers/riams_mcp
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

# RIAMS API (для production)
RIAMS_API_URL=https://riams.rosminzdrav.ru/api/v1
RIAMS_API_KEY=your_riams_api_key

# Режим работы
RIAMS_MOCK_MODE=true  # true для MVP с mock responses, false для production
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
    "riams": {
      "command": "python",
      "args": ["/path/to/mcp-servers/riams_mcp/server.py"],
      "env": {
        "BACKEND_API_URL": "https://api.beercut.tech",
        "BACKEND_API_TOKEN": "your_token",
        "RIAMS_MOCK_MODE": "true"
      }
    }
  }
}
```

### Примеры использования

#### Список регионов

```python
# Claude может использовать этот tool:
list_riams_regions()

# Ответ:
{
  "total": 10,
  "regions": [
    {"code": "moscow", "name": "Москва", "status": "active"},
    {"code": "saint_petersburg", "name": "Санкт-Петербург", "status": "active"},
    ...
  ]
}
```

#### Валидация пациента

```python
validate_patient_for_riams(patient_id="123", region="moscow")

# Ответ:
{
  "valid": true,
  "patient_id": "123",
  "region": "moscow",
  "errors": [],
  "warnings": ["Рекомендуется указать адрес регистрации в Москве"]
}
```

#### Экспорт пациента

```python
export_patient_to_riams(patient_id="123", region="saint_petersburg")

# Ответ:
{
  "success": true,
  "patient_id": "123",
  "region": "saint_petersburg",
  "riams_id": "RIAMS-SAI-2026-000123",
  "status": "exported",
  "exported_at": "2026-02-27T15:30:00Z"
}
```

#### Проверка статуса

```python
get_riams_sync_status(patient_id="123", region="moscow")

# Ответ:
{
  "patient_id": "123",
  "region": "moscow",
  "riams_id": "RIAMS-MOS-2026-000123",
  "status": "synced",
  "last_sync": "2026-02-27T15:30:00Z",
  "sync_count": 3
}
```

#### История экспортов

```python
get_riams_export_history(region="moscow", status="success", limit=10)

# Ответ:
{
  "region": "moscow",
  "region_name": "Москва",
  "total": 45,
  "exports": [
    {
      "patient_id": "1",
      "riams_id": "RIAMS-MOS-2026-000001",
      "status": "success",
      "exported_at": "2026-02-27T15:30:00Z"
    },
    ...
  ]
}
```

## Архитектура

### MVP Implementation (текущая)

- Использует mock responses для демонстрации паттерна интеграции
- Не требует реальных RIAMS API credentials
- Симулирует задержки сети и различные сценарии ответов
- Поддерживает все 10 регионов с единым интерфейсом
- Идеально для разработки и тестирования

### Production Implementation (требуется)

Для production необходимо:

1. **Backend API endpoints** (`/api/integrations/riams/`):
   - `POST /validate` - валидация данных для региона
   - `POST /export` - экспорт пациента в регион
   - `GET /status/:patientId/:region` - статус синхронизации
   - `GET /history/:region` - история экспортов по региону
   - `GET /regions` - список активных регионов

2. **RIAMS API интеграция**:
   - Реальные credentials для каждого региона
   - OAuth 2.0 или API key аутентификация
   - Обработка региональных особенностей API
   - Rate limits и retry logic
   - Мониторинг доступности региональных систем

3. **Безопасность**:
   - Шифрование sensitive данных
   - Audit logging всех операций
   - Валидация прав доступа по регионам
   - HTTPS для всех запросов
   - Хранение credentials в защищенном хранилище

## Региональные особенности

### Москва (moscow)
- Требуется адрес регистрации в Москве
- Интеграция с ЕМИАС (может использоваться параллельно)
- Дополнительные поля для московских льгот

### Санкт-Петербург (saint_petersburg)
- Требуется адрес регистрации в СПб
- Специфичные коды медицинских учреждений
- Интеграция с городской системой записи

### Другие регионы
- Стандартные требования РИАМС
- Региональные коды медицинских организаций
- Особенности регионального финансирования

## Требования к данным

### Обязательные поля (все регионы)

- **ФИО**: Полное имя пациента
- **Дата рождения**: В формате YYYY-MM-DD
- **СНИЛС**: 11 цифр в формате XXX-XXX-XXX-XX
- **Полис ОМС**: 16 цифр
- **Диагноз**: Код по МКБ-10 (ICD-10)
- **Тип операции**: Код процедуры (SNOMED CT)
- **Регион**: Код региона из списка поддерживаемых

### Региональные требования

- **Адрес регистрации**: Должен соответствовать региону экспорта
- **Медицинская организация**: Код МО в региональном реестре
- **Полис ОМС**: Должен быть действителен в регионе

## Обработка ошибок

Сервер возвращает структурированные ошибки:

```json
{
  "error": "validation_failed",
  "message": "Пациент не готов к экспорту в РИАМС",
  "details": {
    "region": "moscow",
    "missing_fields": ["address"],
    "invalid_fields": ["snils"]
  }
}
```

## Логирование

Все операции логируются с использованием structlog:

```
2026-02-27 15:30:00 [info] Validating patient patient_id=123 region=moscow
2026-02-27 15:30:01 [info] Patient validated successfully patient_id=123 region=moscow valid=true
2026-02-27 15:30:02 [info] Exporting patient to RIAMS patient_id=123 region=moscow
2026-02-27 15:30:05 [info] Patient exported successfully patient_id=123 region=moscow riams_id=RIAMS-MOS-2026-000123
```

## Тестирование

```bash
# Запуск в mock режиме
RIAMS_MOCK_MODE=true python server.py

# Тестирование через MCP inspector
npx @modelcontextprotocol/inspector python server.py

# Тестирование конкретного региона
# (через Claude Desktop с установленным MCP сервером)
```

## Мониторинг

Рекомендуется мониторить:
- Количество успешных/неудачных экспортов по регионам
- Время ответа региональных API
- Доступность региональных систем
- Очередь неотправленных данных

## Roadmap

- [ ] Реализация реальных RIAMS API endpoints на backend
- [ ] Поддержка дополнительных регионов
- [ ] Batch export (массовый экспорт пациентов)
- [ ] Автоматическая синхронизация по расписанию
- [ ] Dashboard для мониторинга интеграции по регионам
- [ ] Поддержка FHIR R4 формата
- [ ] Webhook notifications от региональных систем
- [ ] Fallback механизмы при недоступности региона

## Поддержка

Для вопросов и проблем создавайте issue в репозитории проекта.

## Лицензия

MIT
