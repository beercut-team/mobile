# MCP Servers для Medical App

Коллекция Model Context Protocol серверов для интеграции медицинского приложения с внешними системами.

## Серверы

### 1. EMIAS MCP Server (`emias_mcp/`)

Интеграция с Единой медицинской информационно-аналитической системой (ЕМИАС) города Москвы.

**Возможности:**
- Валидация данных пациентов перед экспортом
- Экспорт пациентов в ЕМИАС
- Проверка статуса синхронизации
- История экспортов

**Документация:** [emias_mcp/README.md](emias_mcp/README.md)

### 2. RIAMS MCP Server (`riams_mcp/`)

Интеграция с Региональной информационно-аналитической медицинской системой (РИАМС).

**Возможности:**
- Поддержка 10 регионов России
- Валидация с учетом региональных требований
- Экспорт пациентов в региональные системы
- Мониторинг статуса по регионам

**Документация:** [riams_mcp/README.md](riams_mcp/README.md)

## Быстрый старт

### Установка

```bash
# EMIAS
cd emias_mcp
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Настройте .env файл

# RIAMS
cd ../riams_mcp
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Настройте .env файл
```

### Запуск

```bash
# EMIAS
cd emias_mcp
python server.py

# RIAMS
cd riams_mcp
python server.py
```

### Интеграция с Claude Desktop

Добавьте в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "emias": {
      "command": "python",
      "args": ["/absolute/path/to/mcp-servers/emias_mcp/server.py"],
      "env": {
        "BACKEND_API_URL": "https://api.beercut.tech",
        "BACKEND_API_TOKEN": "your_token",
        "EMIAS_MOCK_MODE": "true"
      }
    },
    "riams": {
      "command": "python",
      "args": ["/absolute/path/to/mcp-servers/riams_mcp/server.py"],
      "env": {
        "BACKEND_API_URL": "https://api.beercut.tech",
        "BACKEND_API_TOKEN": "your_token",
        "RIAMS_MOCK_MODE": "true"
      }
    }
  }
}
```

## Архитектура

### MVP Implementation (текущая)

Оба сервера работают в **mock режиме**:
- Симулируют API responses без реальных внешних вызовов
- Не требуют credentials внешних систем
- Демонстрируют паттерн интеграции
- Идеально для разработки и тестирования

### Production Implementation (требуется)

Для production необходимо:

1. **Backend API endpoints**:
   - Реализовать endpoints в `/api/integrations/emias/` и `/api/integrations/riams/`
   - Добавить валидацию, экспорт, статус, историю

2. **Внешние API интеграции**:
   - Получить credentials для ЕМИАС и РИАМС
   - Реализовать OAuth 2.0 / API key аутентификацию
   - Обработать rate limits и retry logic

3. **Безопасность**:
   - Шифрование sensitive данных
   - Audit logging
   - Валидация прав доступа

## Технологии

- **Python 3.10+**
- **MCP SDK** - Model Context Protocol
- **httpx** - Async HTTP client
- **Pydantic** - Data validation
- **structlog** - Structured logging

## Тестирование

```bash
# Запуск в mock режиме
EMIAS_MOCK_MODE=true python emias_mcp/server.py
RIAMS_MOCK_MODE=true python riams_mcp/server.py

# Тестирование через MCP inspector
npx @modelcontextprotocol/inspector python emias_mcp/server.py
npx @modelcontextprotocol/inspector python riams_mcp/server.py
```

## Roadmap

### EMIAS
- [ ] Production API endpoints
- [ ] OAuth 2.0 аутентификация
- [ ] Batch export
- [ ] Webhook notifications
- [ ] FHIR R4 support

### RIAMS
- [ ] Production API endpoints
- [ ] Поддержка дополнительных регионов
- [ ] Региональные особенности API
- [ ] Мониторинг доступности регионов
- [ ] Fallback механизмы

## Поддержка

Для вопросов и проблем создавайте issue в репозитории проекта.

## Лицензия

MIT
