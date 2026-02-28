<div align="center">

# 🏥 Medical Patient Management System

### Мобильное приложение для управления пациентами и хирургическими операциями

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Query](https://img.shields.io/badge/React%20Query-5.90-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)

[Возможности](#-возможности) • [Установка](#-установка) • [Архитектура](#-архитектура) • [API](#-api) • [Тестирование](#-тестирование)

</div>

---

## 📋 О проекте

Кросс-платформенное мобильное приложение для управления медицинскими записями пациентов, планирования операций и координации между врачами, хирургами и пациентами. Построено на React Native с использованием Expo SDK 54 и поддерживает iOS, Android и Web из единой кодовой базы.

### 🎯 Целевая аудитория

- **👨‍⚕️ Участковые врачи** — создание и ведение карт пациентов
- **👨‍⚕️ Хирурги** — проверка, одобрение и планирование операций
- **👤 Пациенты** — просмотр своих медицинских данных через код доступа
- **👔 Администраторы** — управление системой и модерация

---

## ✨ Возможности

### 🔐 Аутентификация и безопасность
- JWT-токены с автоматическим обновлением
- Ролевая система доступа (DISTRICT_DOCTOR, SURGEON, PATIENT, ADMIN)
- Безопасное хранение токенов (SecureStore на iOS/Android, localStorage на Web)

### 📊 Управление пациентами
- Полный жизненный цикл: NEW → PREPARATION → REVIEW_NEEDED → APPROVED → SURGERY_SCHEDULED → COMPLETED/REJECTED
- Паспортные данные и медицинская история
- Прикрепление фото и документов с категоризацией
- Поддержка международных медицинских стандартов (ICD-10, SNOMED CT, LOINC, HL7/FHIR)

### 🔬 Медицинские инструменты
- **IOL калькулятор** — расчет силы интраокулярной линзы (формулы SRKT, Haigis, Hoffer Q)
- **Чек-листы** — предоперационные проверки с отслеживанием прогресса
- **Комментарии** — система обсуждений с пометкой срочности
- **Интеграции** — экспорт в ЕМИАС (Москва) и РИАМС (регионы)

### 🔔 Уведомления
- Push-уведомления через Expo Notifications
- 10 типов событий (изменение статуса, новые комментарии, напоминания об операциях)
- Счетчик непрочитанных на иконке приложения
- Навигация к пациенту при нажатии

### 📴 Offline-first архитектура
- Очередь мутаций для работы без интернета
- Автоматическая синхронизация при восстановлении связи
- Индикатор offline-режима в UI

### ♿ Доступность
- Режим высокой контрастности
- Увеличение шрифтов (2x) для слабовидящих
- Поддержка VoiceOver/TalkBack

### 📄 Документы
- Генерация PDF (маршрутные листы, отчеты по чек-листам)
- Платформо-специфичная загрузка и шаринг файлов

---

## 🛠 Технологический стек

<div align="center">

| Категория | Технологии |
|-----------|-----------|
| **Framework** | React Native 0.81.5, Expo SDK 54 |
| **UI** | React 19, React Native Reanimated, Expo Symbols |
| **Routing** | Expo Router (file-based) |
| **State** | React Query, React Context |
| **Storage** | AsyncStorage, SecureStore |
| **Network** | Fetch API, NetInfo |
| **Notifications** | Expo Notifications |
| **Media** | Expo Image Picker, Document Picker |
| **Language** | TypeScript 5.9 (strict mode) |
| **Linting** | ESLint (expo config) |

</div>

---

## 🚀 Установка

### Предварительные требования

- Node.js 18+ и npm
- iOS: Xcode 15+ и iOS Simulator
- Android: Android Studio и Android Emulator
- Expo CLI: `npm install -g expo-cli`

### Шаги установки

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd mobile

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm start

# 4. Запустить на конкретной платформе
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Браузер
```

### 🌱 Заполнение тестовыми данными

```bash
# Полная инициализация (логин + 5 пациентов + комментарии + IOL расчеты)
npm run seed <EMAIL> <PASSWORD>

# Отдельные команды
npm run seed:patients <TOKEN>      # Только пациенты
npm run seed:comments <TOKEN>      # Комментарии
npm run seed:iol <TOKEN>           # IOL расчеты
npm run seed:statuses <TOKEN>      # Обновление статусов
npm run seed:medical <EMAIL> <PASSWORD>  # Медицинские метаданные (ICD-10, SNOMED, LOINC)
```

---

## 🏗 Архитектура

### Структура проекта

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Группа маршрутов: логин/регистрация
│   ├── (tabs)/            # Группа маршрутов: основное приложение с табами
│   └── _layout.tsx        # Корневой layout с провайдерами
├── components/
│   ├── ui/                # UI-примитивы (Button, Input, Card, Modal)
│   └── patient/           # Доменные компоненты пациентов
├── contexts/              # React Context провайдеры
│   ├── auth-context.tsx
│   ├── toast-context.tsx
│   └── accessibility-context.tsx
├── hooks/                 # Кастомные хуки (usePatientDetail, useComments)
├── lib/                   # API клиенты и бизнес-логика
│   ├── api.ts            # Базовый API клиент с auto-refresh
│   ├── patients.ts       # Пациенты API
│   ├── notifications.ts  # Уведомления API
│   ├── medical-standards/ # ICD-10, SNOMED, LOINC, FHIR
│   └── integrations/     # ЕМИАС, РИАМС
├── constants/            # Темы, цвета, конфигурация
├── scripts/              # Утилиты для seed и тестирования
└── __tests__/            # Тесты (Node.js скрипты, без фреймворка)
```

### Ключевые паттерны

**Routing:** File-based routing через Expo Router. Две группы маршрутов: `(auth)` для неавторизованных, `(tabs)` для основного приложения.

**Authentication:** JWT с refresh tokens. Автоматическое обновление токенов при 401 через singleton promise (предотвращает race conditions).

**State Management:**
- Server state → React Query (5 мин stale time)
- Auth state → React Context
- UI state → Local state + Context

**API Layer:** Централизованный `apiFetch()` в `/lib/api.ts` с автоматической обработкой auth headers. Доменные модули инкапсулируют API вызовы.

**Offline Support:** Очередь мутаций в AsyncStorage. Автоматическая синхронизация через `useOfflineSync` хук при восстановлении сети.

**Component Pattern:** Доменная логика в хуках (`usePatientDetail`), презентационные компоненты в `/components`. Все хуки возвращают `{ data, isLoading, error, mutate }`.

---

## 🔌 API

### Base URL
```
https://api.beercut.tech
```

### Основные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/login` | Логин (email + password) |
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/refresh` | Обновление токена |
| `GET` | `/patients` | Список пациентов (с фильтрами) |
| `GET` | `/patients/:id` | Детали пациента |
| `POST` | `/patients` | Создание пациента |
| `PATCH` | `/patients/:id` | Обновление пациента |
| `GET` | `/notifications` | Список уведомлений |
| `GET` | `/notifications/unread-count` | Счетчик непрочитанных |
| `POST` | `/notifications/:id/read` | Пометить как прочитанное |

Полная документация API: см. `/docs/` директорию.

---

## 🧪 Тестирование

Тесты реализованы как standalone Node.js скрипты (без Jest/Vitest).

```bash
# Запустить все тесты
npm run test

# Отдельные тесты
npm run test:icd10      # ICD-10 коды
npm run test:snomed     # SNOMED CT
npm run test:loinc      # LOINC
npm run test:fhir       # FHIR mapper
npm run test:emias      # ЕМИАС интеграция
npm run test:riams      # РИАМС интеграция
```

---

## 📱 Платформы

- ✅ **iOS** 13.4+
- ✅ **Android** 6.0+ (API 23+)
- ✅ **Web** (современные браузеры)

### Платформо-специфичные особенности

- **iOS:** SF Symbols для иконок, Haptic Feedback
- **Android/Web:** Material Icons
- **Web:** localStorage вместо SecureStore

---

## 📚 Документация

- [CLAUDE.md](./CLAUDE.md) — инструкции для Claude Code
- [NOTIFICATIONS_API_SPEC.md](./docs/NOTIFICATIONS_API_SPEC.md) — спецификация API уведомлений
- [MEDICAL_STANDARDS.md](./docs/MEDICAL_STANDARDS.md) — медицинские стандарты (ICD-10, SNOMED, LOINC, FHIR)

---

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменений (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект является частной разработкой.

---

## 👥 Команда

Разработано с ❤️ для улучшения медицинского обслуживания

---

<div align="center">

**[⬆ Наверх](#-medical-patient-management-system)**

</div>
