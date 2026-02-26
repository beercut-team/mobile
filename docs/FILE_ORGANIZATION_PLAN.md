# План организации файлов проекта

**Дата:** 27 февраля 2026
**Проект:** Mobile Medical App

---

## Текущее состояние

### Статистика
- **Общий размер:** 427MB (403MB node_modules, 24MB код и ресурсы)
- **Файлов кода:** 131 TypeScript/JavaScript файлов
- **Документация:** 15 markdown файлов
- **Структура:** Хорошо организована (app/, components/, lib/, hooks/)

### Обнаруженные проблемы

#### 1. Дублирование файлов
- ❌ `api.json` (65KB, английский) и `newapi.json` (66KB, русский)
  - Одинаковые OpenAPI спецификации на разных языках
  - Рекомендация: Оставить `api.json` (английский - стандарт для API docs), удалить `newapi.json`

#### 2. Временные файлы
- ⚠️ `tmp/` директория (2.2MB, 9 скриншотов)
  - `patient-actions-fix.png` (188KB)
  - `patient-detail-after-fix.png` (165KB)
  - `smoke-doctor-login.png` (206KB)
  - `smoke-home.png` (188KB)
  - `smoke-register.png` (351KB)
  - `tab-more-after-fix.png` (258KB)
  - `tab-more.png` (256KB)
  - `tab-patients-after-fix.png` (374KB)
  - `tab-patients.png` (373KB)
  - Рекомендация: Переместить в `docs/screenshots/` или удалить (если уже не нужны)

#### 3. Системные файлы
- ❌ `.DS_Store` в корне проекта
  - Рекомендация: Добавить в `.gitignore`

#### 4. Документация
- ✅ Хорошо организована в `docs/`
- ⚠️ `ЯРОКБ.pdf` (123KB) в `docs/`
  - Рекомендация: Переименовать в латиницу для совместимости (например, `YAROKB.pdf`)

---

## Предлагаемая структура

### Корневой уровень (минимизировать файлы)
```
mobile/
├── app/                    # Expo Router routes
├── assets/                 # Images, fonts
├── components/             # React components
├── constants/              # Theme, config
├── contexts/               # React contexts
├── docs/                   # Documentation
│   ├── api/               # NEW: API specs
│   ├── screenshots/       # NEW: Test screenshots
│   └── reports/           # NEW: Status reports
├── hooks/                  # Custom hooks
├── lib/                    # API clients, utilities
├── scripts/                # Build/seed scripts
├── utils/                  # Helper functions
├── __tests__/              # Tests
├── .gitignore
├── CHANGELOG.md
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
└── app.json
```

---

## План действий

### Шаг 1: Очистка дубликатов
```bash
# Удалить дублирующий API spec
rm newapi.json

# Переместить API spec в docs/api/
mkdir -p docs/api
mv api.json docs/api/openapi.json
```

**Обоснование:**
- Один источник правды для API спецификации
- Логичное расположение в docs/api/
- Стандартное имя `openapi.json`

### Шаг 2: Организация скриншотов
```bash
# Создать директорию для скриншотов
mkdir -p docs/screenshots

# Переместить скриншоты из tmp/
mv tmp/*.png docs/screenshots/

# Удалить пустую tmp/ директорию
rmdir tmp
```

**Обоснование:**
- Скриншоты - часть документации (smoke tests, bug reports)
- Централизованное хранение в docs/screenshots/
- Освобождение корня от временных файлов

### Шаг 3: Организация документации
```bash
# Создать поддиректории в docs/
mkdir -p docs/reports
mkdir -p docs/guides

# Переместить отчеты
mv docs/STATUS_REPORT_2026-02-27.md docs/reports/
mv docs/3P_UPDATE_2026-02-27.md docs/reports/
mv docs/COMPLIANCE_REPORT.md docs/reports/
mv docs/DEVELOPER_GROWTH_ANALYSIS.md docs/reports/

# Переместить гайды
mv docs/WEB_TESTING_GUIDE.md docs/guides/
mv docs/NOTIFICATIONS_IMPLEMENTATION_GUIDE.md docs/guides/
mv docs/MEDICAL_STANDARDS_IMPLEMENTATION.md docs/guides/
mv docs/MEDICAL_STANDARDS_UI_GUIDE.md docs/guides/

# Переименовать PDF
mv docs/ЯРОКБ.pdf docs/YAROKB.pdf
```

**Обоснование:**
- Разделение по типам: reports (статус-репорты), guides (инструкции), specs (API/backend)
- Улучшенная навигация
- Латиница для совместимости

### Шаг 4: Обновление .gitignore
```bash
# Добавить в .gitignore
echo "" >> .gitignore
echo "# macOS" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "" >> .gitignore
echo "# Temporary files" >> .gitignore
echo "tmp/" >> .gitignore
echo "*.tmp" >> .gitignore
echo "*.log" >> .gitignore
```

**Обоснование:**
- Предотвращение коммита системных файлов
- Защита от временных файлов в будущем

### Шаг 5: Удаление системных файлов
```bash
# Удалить .DS_Store
find . -name ".DS_Store" -delete
```

---

## Итоговая структура docs/

```
docs/
├── api/
│   └── openapi.json                    # API спецификация
├── guides/
│   ├── WEB_TESTING_GUIDE.md
│   ├── NOTIFICATIONS_IMPLEMENTATION_GUIDE.md
│   ├── MEDICAL_STANDARDS_IMPLEMENTATION.md
│   └── MEDICAL_STANDARDS_UI_GUIDE.md
├── reports/
│   ├── STATUS_REPORT_2026-02-27.md
│   ├── 3P_UPDATE_2026-02-27.md
│   ├── COMPLIANCE_REPORT.md
│   └── DEVELOPER_GROWTH_ANALYSIS.md
├── screenshots/
│   ├── patient-actions-fix.png
│   ├── patient-detail-after-fix.png
│   ├── smoke-doctor-login.png
│   ├── smoke-home.png
│   ├── smoke-register.png
│   ├── tab-more-after-fix.png
│   ├── tab-more.png
│   ├── tab-patients-after-fix.png
│   └── tab-patients.png
├── MEDICAL_STANDARDS.md               # Спецификации
├── NOTIFICATIONS_API_SPEC.md
├── NOTIFICATIONS_BACKEND_TODO.md
├── NOTIFICATIONS_TEST_RESULTS.md
└── YAROKB.pdf                          # Референсный документ
```

---

## Преимущества новой структуры

### 1. Чистый корень проекта
- Только необходимые конфигурационные файлы
- Нет дубликатов и временных файлов
- Легче ориентироваться новым разработчикам

### 2. Логичная организация документации
- **api/**: API спецификации
- **guides/**: Инструкции по реализации
- **reports/**: Статус-репорты и анализ
- **screenshots/**: Визуальные материалы
- Корень docs/: Спецификации и референсы

### 3. Улучшенная навигация
- Быстрый поиск нужного типа документа
- Понятная иерархия
- Масштабируемость (легко добавлять новые категории)

### 4. Совместимость
- Латиница в именах файлов
- Стандартные имена (openapi.json)
- Кросс-платформенность

---

## Верификация после выполнения

### Проверить структуру
```bash
tree docs/ -L 2
ls -lh docs/api/
ls -lh docs/screenshots/
```

### Проверить отсутствие дубликатов
```bash
ls -lh *.json  # Должен остаться только package.json, tsconfig.json, app.json
```

### Проверить .gitignore
```bash
cat .gitignore | grep -E "(DS_Store|tmp)"
```

### Проверить отсутствие системных файлов
```bash
find . -name ".DS_Store"  # Должно быть пусто
```

---

## Поддержка в будущем

### Правила для новых файлов

1. **Скриншоты/изображения документации** → `docs/screenshots/`
2. **Статус-репорты/анализ** → `docs/reports/`
3. **Инструкции/гайды** → `docs/guides/`
4. **API спецификации** → `docs/api/`
5. **Временные файлы** → `tmp/` (добавлена в .gitignore)

### Регулярная очистка

**Еженедельно:**
- Проверить `tmp/` на старые файлы
- Удалить `.DS_Store` если появились

**Ежемесячно:**
- Архивировать старые скриншоты (>1 месяца)
- Переместить старые отчеты в `docs/reports/archive/`

**Ежеквартально:**
- Проверить дубликаты файлов
- Обновить документацию

---

## Готово к выполнению?

План готов. Все изменения безопасны (только перемещение и удаление дубликатов).

**Время выполнения:** ~2 минуты

**Риски:** Минимальные (не затрагивает код, только организация файлов)

**Откат:** Легко (git restore если что-то пойдет не так)

Выполнить план? (yes/no)
